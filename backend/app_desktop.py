"""
多通道系统测试软件 - 桌面应用版本
使用 Pywebview 创建独立桌面窗口
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import sys
from datetime import datetime
import threading
import time
import webview

# !!重要!! 必须先配置日志系统，再导入控制器
# 因为控制器在导入时就会获取 logger 实例
from logger_config import setup_logger, log_session_separator

# 配置改进的日志系统（在导入控制器之前）
logger = setup_logger(
    name='multi_channel_system',
    log_dir='logs',
    max_bytes=10*1024*1024,  # 10MB per file
    backup_count=20  # Keep 20 backup files
)

# 导入矩阵开关模块（logger已配置好）
from matrix_controller import MatrixController

# 导入网络分析仪模块（logger已配置好）
from vna_controller import VNAController

# 计算静态目录（兼容 PyInstaller）
if getattr(sys, 'frozen', False):
    # 打包后的环境
    BASE_PATH = sys._MEIPASS
else:
    # 开发环境
    BASE_PATH = os.path.abspath(os.path.dirname(__file__))

STATIC_FOLDER = os.path.join(BASE_PATH, "dist")

# 创建Flask应用
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="")
CORS(app)

# 创建控制器实例
matrix_controller = MatrixController()
vna_controller = VNAController()

# ==================== 静态文件路由 ====================

@app.route('/')
def index():
    """主页路由"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    """静态文件路由"""
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# ==================== 矩阵开关API ====================

@app.route('/api/matrix/ports', methods=['GET'])
def get_matrix_ports():
    return matrix_controller.get_ports()

@app.route('/api/matrix/connect', methods=['POST'])
def connect_matrix():
    return matrix_controller.connect(request.json)

@app.route('/api/matrix/disconnect', methods=['POST'])
def disconnect_matrix():
    return matrix_controller.disconnect()

@app.route('/api/matrix/status', methods=['GET'])
def matrix_status():
    return matrix_controller.get_status()

@app.route('/api/matrix/command', methods=['POST'])
def send_matrix_command():
    return matrix_controller.send_command(request.json)

@app.route('/api/matrix/route', methods=['POST'])
def matrix_route():
    return matrix_controller.route_switch(request.json)

@app.route('/api/matrix/switch', methods=['POST'])
def matrix_switch():
    return matrix_controller.switch_control(request.json)

# ==================== VNA API ====================

@app.route('/api/vna/devices', methods=['GET'])
def get_vna_devices():
    return vna_controller.get_devices()

@app.route('/api/vna/connect', methods=['POST'])
def connect_vna():
    return vna_controller.connect(request.json)

@app.route('/api/vna/disconnect', methods=['POST'])
def disconnect_vna():
    return vna_controller.disconnect()

@app.route('/api/vna/status', methods=['GET'])
def vna_status():
    return vna_controller.get_status()

@app.route('/api/vna/start-measurement', methods=['POST'])
def start_vna_measurement():
    return vna_controller.start_measurement(request.json)

@app.route('/api/vna/stop-measurement', methods=['POST'])
def stop_vna_measurement():
    return vna_controller.stop_measurement()

@app.route('/api/vna/measurement-status', methods=['GET'])
def vna_measurement_status():
    return vna_controller.get_measurement_status()

@app.route('/api/vna/mixer-config', methods=['GET'])
def get_mixer_config():
    """获取混频器配置"""
    try:
        return jsonify({
            'success': True,
            'config': vna_controller.mixer_config
        })
    except Exception as e:
        logger.error(f"获取混频器配置失败: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/vna/mixer-config', methods=['POST'])
def set_mixer_config():
    """设置混频器配置（支持罗德ZNA26和思仪3674L）"""
    try:
        data = request.json
        
        # 检查设备连接状态
        if not vna_controller.is_connected():
            return jsonify({'success': False, 'message': '请先连接VNA设备'}), 400
        
        device_type = vna_controller.device_type
        logger.info(f"设置混频器配置 - 设备类型: {device_type}")
        
        errors = []
        
        # 根据设备类型进行不同的验证和配置
        if device_type == 'rohde-zna26':
            # 罗德ZNA26 - VMIX模式验证
            ports = [data.get('rfPort'), data.get('ifPort'), data.get('loPort')]
            if len(set(ports)) != len(ports):
                errors.append('RF、IF、LO端口不能重复')
            
            lo_freq = data.get('loFrequency', 0)
            if not (10 <= lo_freq <= 26500):
                errors.append('LO频率范围: 10-26500 MHz')
            
            lo_power = data.get('loPower', 0)
            if not (-30 <= lo_power <= 10):
                errors.append('LO功率范围: -30 至 +10 dBm')
            
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400
            
            # 更新罗德配置
            vna_controller.mixer_config.update(data)
            logger.info(f"罗德ZNA26混频器配置已更新: {vna_controller.mixer_config}")
            
        elif device_type == 'siyi-3674l':
            # 思仪3674L - Scalar Mixer模式验证
            input_start = data.get('input_start_freq', 0)  # Hz
            input_stop = data.get('input_stop_freq', 0)    # Hz
            
            if not (10e6 <= input_start <= 67e9):
                errors.append('Input起始频率范围: 10 MHz - 67 GHz')
            if not (10e6 <= input_stop <= 67e9):
                errors.append('Input终止频率范围: 10 MHz - 67 GHz')
            if input_start >= input_stop:
                errors.append('Input起始频率必须小于终止频率')
            
            input_power = data.get('input_power', 0)
            if not (-55 <= input_power <= 10):
                errors.append('Input功率范围: -55 至 +10 dBm')
            
            lo_port = data.get('lo_port', 0)
            if not (1 <= lo_port <= 4):
                errors.append('LO端口范围: 1-4')
            
            lo_freq = data.get('lo_freq', 0)  # Hz
            if not (10e6 <= lo_freq <= 67e9):
                errors.append('LO频率范围: 10 MHz - 67 GHz')
            
            lo_power = data.get('lo_power', 0)
            if not (-55 <= lo_power <= 10):
                errors.append('LO功率范围: -55 至 +10 dBm')
            
            sideband = data.get('sideband', 'LOW')
            if sideband not in ['LOW', 'HIGH']:
                errors.append('边带选择: LOW 或 HIGH')
            
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400
            
            # 更新思仪配置
            vna_controller.mixer_config.update(data)
            logger.info(f"思仪3674L混频器配置已更新: {vna_controller.mixer_config}")
            
            # 调用思仪设备驱动配置混频器
            if vna_controller.device_driver and hasattr(vna_controller.device_driver, 'configure_mixer_mode'):
                success, message = vna_controller.device_driver.configure_mixer_mode(data)
                if not success:
                    logger.error(f"思仪设备混频器配置失败: {message}")
                    return jsonify({'success': False, 'message': message}), 500
                logger.info(f"思仪设备混频器配置成功: {message}")
            else:
                logger.warning("设备驱动不支持configure_mixer_mode方法")
                return jsonify({'success': False, 'message': '设备驱动不支持混频器配置'}), 400
        
        else:
            return jsonify({'success': False, 'message': f'设备 {device_type} 不支持混频器模式'}), 400
        
        return jsonify({
            'success': True,
            'message': '混频器配置已更新并应用到设备',
            'config': vna_controller.mixer_config
        })
    except Exception as e:
        logger.error(f"设置混频器配置失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== 状态查询 API ====================
# 注意：前端应使用轮询方式定期查询这些端点获取最新状态

@app.route('/api/vna/export-data', methods=['POST'])
def export_vna_data():
    return vna_controller.export_data(request.json)

@app.route('/api/vna/open-results-folder', methods=['POST'])
def open_vna_results_folder():
    return vna_controller.open_results_folder(request.json)

@app.route('/api/system/info', methods=['GET'])
def system_info():
    """系统信息"""
    return jsonify({
        'success': True,
        'version': '1.0.0',
        'name': '多通道系统测试软件',
        'timestamp': datetime.now().isoformat()
    })

# ==================== Flask 服务器启动函数 ====================

def start_flask_server(port=5000):
    """在后台线程启动 Flask 服务器（使用 Waitress WSGI 服务器）"""
    try:
        from waitress import serve
        logger.info(f"后端服务启动 http://127.0.0.1:{port}")
        # 使用 waitress 服务器，适合生产环境
        serve(app, host='127.0.0.1', port=port, threads=6, _quiet=True)
    except Exception as e:
        logger.error(f"服务器启动失败: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    logger.info("多通道系统测试软件 v1.0.1 启动")
    
    os.makedirs('results', exist_ok=True)
    
    port = int(os.environ.get('PORT', 5000))
    server_url = f"http://127.0.0.1:{port}"
    
    server_thread = threading.Thread(target=start_flask_server, args=(port,), daemon=True)
    server_thread.start()
    
    time.sleep(2)
    
    try:
        window = webview.create_window(
            title='多通道系统测试软件 v1.0.1',
            url=server_url,
            width=1200,
            height=700,
            resizable=True,
            fullscreen=False,
            min_size=(1100, 650)
        )
        
        logger.info("应用窗口已打开")
        webview.start()
        
    except Exception as e:
        logger.error(f"启动失败: {str(e)}")
        import traceback
        traceback.print_exc()
    
    logger.info("应用已关闭")


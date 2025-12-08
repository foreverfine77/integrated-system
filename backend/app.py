"""
多通道系统测试软件 - 后端服务
整合矩阵开关控制和矢量网络分析仪测量功能
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import sys
import logging
from datetime import datetime
import threading
import time

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
BASE_PATH = getattr(sys, "_MEIPASS", os.path.abspath(os.path.dirname(__file__)))
STATIC_FOLDER = os.path.join(BASE_PATH, "dist")
if not os.path.exists(STATIC_FOLDER):
    ROOT_DIST = os.path.abspath(os.path.join(BASE_PATH, "..", "dist"))
    if os.path.exists(ROOT_DIST):
        STATIC_FOLDER = ROOT_DIST

# 创建Flask应用
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="")
CORS(app)

# 全局控制器实例
matrix_controller = MatrixController()
vna_controller = VNAController()

# ==================== 前端静态托管 ====================
@app.route('/')
def index():
    """主页"""
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
    """获取系统可用的串口列表"""
    return matrix_controller.get_ports()

@app.route('/api/matrix/connect', methods=['POST'])
def connect_matrix():
    """连接矩阵开关设备"""
    data = request.json
    return matrix_controller.connect(data)

@app.route('/api/matrix/disconnect', methods=['POST'])
def disconnect_matrix():
    """断开矩阵开关连接"""
    return matrix_controller.disconnect()

@app.route('/api/matrix/status', methods=['GET'])
def get_matrix_status():
    """获取矩阵开关连接状态"""
    return matrix_controller.get_status()

@app.route('/api/matrix/command', methods=['POST'])
def send_matrix_command():
    """发送命令到矩阵开关"""
    data = request.json
    return matrix_controller.send_command(data)

@app.route('/api/matrix/route', methods=['POST'])
def matrix_route():
    """矩阵开关：切换射频通道"""
    data = request.json
    return matrix_controller.set_route(data)

@app.route('/api/matrix/switch', methods=['POST'])
def matrix_switch():
    """矩阵开关：切换开关端口"""
    data = request.json
    return matrix_controller.set_switch(data)

# ==================== 矢量网络分析仪API ====================

@app.route('/api/vna/devices', methods=['GET'])
def get_vna_devices():
    """获取可用的VNA设备列表"""
    return vna_controller.get_devices()

@app.route('/api/vna/connect', methods=['POST'])
def connect_vna():
    """连接VNA设备"""
    data = request.json
    return vna_controller.connect(data)

@app.route('/api/vna/disconnect', methods=['POST'])
def disconnect_vna():
    """断开VNA连接"""
    return vna_controller.disconnect()

@app.route('/api/vna/status', methods=['GET'])
def get_vna_status():
    """获取VNA连接状态"""
    return vna_controller.get_status()

@app.route('/api/vna/start-measurement', methods=['POST'])
def start_vna_measurement():
    """开始VNA测量"""
    data = request.json
    return vna_controller.start_measurement(data)

@app.route('/api/vna/stop-measurement', methods=['POST'])
def stop_vna_measurement():
    """停止VNA测量"""
    return vna_controller.stop_measurement()

@app.route('/api/vna/measurement-status', methods=['GET'])
def get_vna_measurement_status():
    """获取VNA测量状态"""
    return vna_controller.get_measurement_status()

@app.route('/api/vna/export-data', methods=['POST'])
def export_vna_data():
    """导出VNA测量数据"""
    data = request.json
    return vna_controller.export_data(data)

@app.route('/api/vna/connection-history', methods=['GET'])
def get_vna_connection_history():
    """获取VNA历史连接记录"""
    return vna_controller.get_connection_history()

@app.route('/api/vna/connection-history/<ip_address>/<int:port>', methods=['DELETE'])
def remove_vna_from_history(ip_address, port):
    """从历史记录中移除VNA连接"""
    return vna_controller.remove_from_history(ip_address, port)

@app.route('/api/vna/connection-history/clear', methods=['POST'])
def clear_vna_connection_history():
    """清除VNA所有历史连接记录"""
    return vna_controller.clear_connection_history()

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
            
            # TODO: 调用罗德设备驱动的混频器配置方法
            # 罗德设备的configure_mixer方法尚未实现，这里只保存配置
            
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

# ==================== 系统健康检查 ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'service': '多通道系统测试软件',
        'version': '1.0.0',
        'modules': {
            'matrix_switch': matrix_controller.is_connected(),
            'vna': vna_controller.is_connected()
        },
        'timestamp': datetime.now().isoformat()
    })

# ==================== 启动服务器 ====================

if __name__ == '__main__':
    logger.info("=" * 70)
    logger.info("多通道系统测试软件 - 后端服务启动")
    logger.info("=" * 70)
    logger.info("模块: 矩阵开关控制 + 矢量网络分析仪测量")
    
    # 创建必要的目录
    os.makedirs('results', exist_ok=True)
    
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"访问地址: http://localhost:{port}")
    logger.info("=" * 70)
    
    # 使用 waitress 生产服务器
    try:
        from waitress import serve
        logger.info("按 Ctrl+C 停止服务")
        serve(app, host='127.0.0.1', port=port, threads=4)
    except ImportError:
        logger.error("=" * 70)
        logger.error("错误：未安装 waitress 服务器")
        logger.info("按 Ctrl+C 停止服务")
        logger.info("请运行: pip install waitress")
        import sys
        sys.exit(1)


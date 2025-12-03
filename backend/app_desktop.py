"""
多通道系统测试软件 - 桌面应用版本
使用 Pywebview 创建独立桌面窗口
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import sys
import logging
from datetime import datetime
import threading
import time
import webview

# 导入矩阵开关模块
from matrix_controller import MatrixController

# 导入网络分析仪模块
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

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # 终端输出
        logging.FileHandler('system.log', encoding='utf-8')  # 文件保存
    ]
)

logger = logging.getLogger(__name__)

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
        logger.info("使用 Waitress WSGI 服务器启动")
        logger.info(f"服务地址: http://127.0.0.1:{port}")
        # 使用 waitress 服务器，适合生产环境
        serve(app, host='127.0.0.1', port=port, threads=6, _quiet=True)
    except Exception as e:
        logger.error(f"服务器启动失败: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    logger.info("=" * 70)
    logger.info("多通道系统测试软件 - 桌面版启动")
    logger.info("=" * 70)
    logger.info("模块: 矩阵开关控制 + 矢量网络分析仪测量")
    
    os.makedirs('results', exist_ok=True)
    
    port = int(os.environ.get('PORT', 5000))
    server_url = f"http://127.0.0.1:{port}"
    
    logger.info(f"后端服务: {server_url}")
    logger.info("=" * 70)
    
    server_thread = threading.Thread(target=start_flask_server, args=(port,), daemon=True)
    server_thread.start()
    
    logger.info("等待服务器启动...")
    time.sleep(2)
    
    logger.info("创建桌面窗口...")
    try:
        window = webview.create_window(
            title='多通道系统测试软件 v1.0.1',
            url=server_url,
            width=1400,
            height=900,
            resizable=True,
            fullscreen=False,
            min_size=(1200, 800)
        )
        
        logger.info("应用启动成功")
        logger.info("=" * 70)
        webview.start()
        
    except Exception as e:
        logger.error(f"启动失败: {str(e)}")
        import traceback
        traceback.print_exc()
    
    logger.info("应用已关闭")

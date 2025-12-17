"""
统一配置管理模块
集中管理所有应用配置
"""
import os

class AppSettings:
    """应用全局配置"""
    
    # ==================== 应用信息 ====================
    APP_NAME = "多通道系统测试软件"
    APP_VERSION = "1.0.1"
    
    # ==================== 日志配置 ====================
    LOG_DIR = 'logs'
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 20
    LOG_ERROR_BACKUP_COUNT = 5
    LOG_NAME = 'multi_channel_system'  # 统一的logger名称
    
    # ==================== VNA配置 ====================
    VNA_DEFAULT_TIMEOUT = 60  # 秒
    VNA_CONNECTION_HISTORY_FILE = 'storage/vna_connection_history.json'
    VNA_MIXER_CONFIG_FILE = 'storage/mixer_config.json'
    VNA_MAX_HISTORY_ITEMS = 10
    
    # VNA频率范围限制（MHz）
    VNA_FREQ_MIN = 10
    VNA_FREQ_MAX = 26500
    
    # VNA功率范围限制（dBm）
    VNA_POWER_MIN = -30
    VNA_POWER_MAX = 10
    
    # ==================== 矩阵开关配置 ====================
    MATRIX_BAUDRATE = 9600
    MATRIX_TIMEOUT = 1.0  # 秒
    MATRIX_MAX_CHANNELS = 128
    
    # ==================== 测量结果配置 ====================
    RESULTS_DIR = 'results'
    RESULTS_AUTOSAVE = True
    
    # ==================== Flask服务器配置 ====================
    FLASK_HOST = '127.0.0.1'
    FLASK_PORT = 5000
    FLASK_THREADS = 6
    
    # ==================== 桌面窗口配置 ====================
    WINDOW_TITLE = f"{APP_NAME} v{APP_VERSION}"
    WINDOW_WIDTH = 1400
    WINDOW_HEIGHT = 900
    WINDOW_MIN_WIDTH = 1200
    WINDOW_MIN_HEIGHT = 800
    
    @classmethod
    def get_storage_path(cls, filename):
        """获取存储文件的完整路径"""
        storage_dir = 'storage'
        os.makedirs(storage_dir, exist_ok=True)
        return os.path.join(storage_dir, filename)
    
    @classmethod
    def get_results_path(cls, filename=''):
        """获取结果文件的完整路径"""
        os.makedirs(cls.RESULTS_DIR, exist_ok=True)
        if filename:
            return os.path.join(cls.RESULTS_DIR, filename)
        return cls.RESULTS_DIR


# 混频器默认配置
DEFAULT_MIXER_CONFIG = {
    'enabled': False,
    'rfPort': 1,
    'ifPort': 2,
    'loPort': 3,
    'loFrequency': 1000,  # MHz
    'loPower': 0  # dBm
}

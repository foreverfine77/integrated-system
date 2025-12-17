"""
设备配置
定义各型号设备的参数范围与默认值
"""

# 思仪 3674L 配置
SIYI_3674L = {
    'id': 'siyi-3674l',
    'name': '思仪 3674L',
    'type': '网络分析仪',
    'description': '支持S参数测量，频率范围10MHz-67GHz',
    'freq_range': (10e6, 67e9),  # 10MHz - 67GHz
    'max_points': 16001,
    'if_bandwidth': {
        'min': 1,       # 1Hz
        'max': 3e6,     # 3MHz
        'default': 1000 # 1kHz
    },
    'power_level': {
        'min': -55,     # -55dBm
        'max': 10,      # +10dBm
        'default': -10  # -10dBm
    },
    'parameters': {
        'vector': ['S11', 'S12', 'S21', 'S22', 'SC11', 'SC12', 'SC21', 'SC22'],
        'scalar': ['IPWR', 'OPWR', 'REVIPWR', 'REVOPWR']
    },
    'default_port': 5025
}

# 罗德 ZNA26 配置
ROHDE_ZNA26 = {
    'id': 'rohde-zna26',
    'name': '罗德 ZNA26',
    'type': '网络分析仪',
    'description': '支持S参数测量，频率范围10MHz-26.5GHz',
    'freq_range': (10e6, 26.5e9),  # 10MHz - 26.5GHz
    'max_points': 100001,
    'if_bandwidth': {
        'min': 1,       # 1Hz
        'max': 1e6,     # 1MHz
        'default': 1000 # 1kHz
    },
    'power_level': {
        'min': -70,     # -70dBm
        'max': 10,      # +10dBm
        'default': -10  # -10dBm
    },
    'parameters': {
        'vector': ['S11', 'S12', 'S21', 'S22', 'SC11', 'SC12', 'SC21', 'SC22'],
        'scalar': ['IPWR', 'OPWR', 'REVIPWR', 'REVOPWR']
    },
    'default_port': 5025
}

# 设备配置映射
DEVICE_CONFIGS = {
    'siyi-3674l': SIYI_3674L,
    'rohde-zna26': ROHDE_ZNA26
}

def get_device_config(device_type: str) -> dict:
    """
    获取设备配置
    
    Args:
        device_type: 设备类型标识符
        
    Returns:
        设备配置字典
        
    Raises:
        KeyError: 不支持的设备类型
    """
    if device_type not in DEVICE_CONFIGS:
        raise KeyError(f"不支持的设备类型: {device_type}")
    return DEVICE_CONFIGS[device_type]

def get_supported_devices() -> list:
    """
    获取支持的设备列表
    
    Returns:
        设备配置列表
    """
    return list(DEVICE_CONFIGS.values())


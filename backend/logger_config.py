"""
日志配置模块
提供改进的日志系统，支持日志轮转和会话跟踪
"""

import logging
import os
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler


def setup_logger(name='system', log_dir='logs', max_bytes=10*1024*1024, backup_count=10):
    """
    配置日志系统
    
    Args:
        name: 日志器名称
        log_dir: 日志文件目录
        max_bytes: 单个日志文件最大大小（默认10MB）
        backup_count: 保留的日志文件数量（默认10个）
    
    Returns:
        配置好的logger实例
    """
    # 创建日志目录
    os.makedirs(log_dir, exist_ok=True)
    
    # 生成当前会话的日志文件名（包含启动时间）
    session_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    current_log_file = os.path.join(log_dir, f'session_{session_time}.log')
    
    # 也保留一个最新日志的符号链接（用于快速查看）
    latest_log_file = os.path.join(log_dir, 'latest.log')
    
    # 创建logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    # 清除已有的handlers（避免重复）
    if logger.hasHandlers():
        logger.handlers.clear()
    
    # 文件日志格式（详细）
    file_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 控制台日志格式（简洁）
    console_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # 1. 当前会话日志文件（无轮转，记录本次启动的所有日志）
    session_handler = logging.FileHandler(
        current_log_file,
        encoding='utf-8',
        mode='w'  # 每次启动创建新文件
    )
    session_handler.setLevel(logging.DEBUG)
    session_handler.setFormatter(file_formatter)
    logger.addHandler(session_handler)
    
    # 2. 轮转日志文件（用于长期保存）
    rotating_handler = RotatingFileHandler(
        latest_log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    rotating_handler.setLevel(logging.INFO)
    rotating_handler.setFormatter(file_formatter)
    logger.addHandler(rotating_handler)
    
    # 3. 控制台输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # 4. 错误日志单独文件
    error_log_file = os.path.join(log_dir, 'errors.log')
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=max_bytes,
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    logger.addHandler(error_handler)
    
    # 记录会话开始
    logger.info("=" * 80)
    logger.info(f"新会话开始 - 会话ID: {session_time}")
    logger.info(f"日志文件: {current_log_file}")
    logger.info("=" * 80)
    
    return logger


def log_session_separator(logger, message=""):
    """记录会话分隔符"""
    logger.info("=" * 80)
    if message:
        logger.info(f"  {message}")
    logger.info("=" * 80)


def log_measurement_start(logger, params):
    """记录测量开始"""
    logger.info("-" * 80)
    logger.info("测量开始")
    logger.info(f"  参数: {params.get('parameters', [])}")
    logger.info(f"  测量次数: {params.get('measurementCount', 0)}")
    logger.info(f"  频点数: {params.get('frequencyPoints', 0)}")
    logger.info(f"  频率范围: {params.get('startFrequency', 0)} - {params.get('stopFrequency', 0)} MHz")
    logger.info("-" * 80)


def log_measurement_end(logger, success=True, message=""):
    """记录测量结束"""
    logger.info("-" * 80)
    if success:
        logger.info(f"测量完成 {message}")
    else:
        logger.error(f"测量失败: {message}")
    logger.info("-" * 80)


# 全局logger实例（用于直接导入使用）
main_logger = None


def get_logger():
    """获取全局logger实例"""
    global main_logger
    if main_logger is None:
        main_logger = setup_logger()
    return main_logger

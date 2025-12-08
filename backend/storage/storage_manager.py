"""
统一存储管理器
提供简单的JSON存储接口
"""
import json
import os
from typing import Any, Optional


class StorageManager:
    """统一的存储管理器"""
    
    def __init__(self, base_dir: str = 'storage'):
        """
        初始化存储管理器
        
        Args:
            base_dir: 存储目录路径
        """
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)
    
    def save_json(self, filename: str, data: Any) -> bool:
        """
        保存数据为JSON文件
        
        Args:
            filename: 文件名
            data: 要保存的数据
            
        Returns:
            是否保存成功
        """
        try:
            filepath = os.path.join(self.base_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"保存JSON失败 {filename}: {e}")
            return False
    
    def load_json(self, filename: str, default: Any = None) -> Any:
        """
        加载JSON文件
        
        Args:
            filename: 文件名
            default: 文件不存在时返回的默认值
            
        Returns:
            加载的数据或默认值
        """
        try:
            filepath = os.path.join(self.base_dir, filename)
            if not os.path.exists(filepath):
                return default
            
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载JSON失败 {filename}: {e}")
            return default
    
    def delete(self, filename: str) -> bool:
        """
        删除存储文件
        
        Args:
            filename: 文件名
            
        Returns:
            是否删除成功
        """
        try:
            filepath = os.path.join(self.base_dir, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
            return True
        except Exception as e:
            print(f"删除文件失败 {filename}: {e}")
            return False
    
    def exists(self, filename: str) -> bool:
        """
        检查文件是否存在
        
        Args:
            filename: 文件名
            
        Returns:
            文件是否存在
        """
        filepath = os.path.join(self.base_dir, filename)
        return os.path.exists(filepath)


# 创建全局实例
storage = StorageManager()

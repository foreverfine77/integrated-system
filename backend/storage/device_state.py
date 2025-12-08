"""
设备状态持久化
记住上次连接的设备信息和历史连接记录
"""

import json
import os
from datetime import datetime
from typing import Dict, Optional, List

STATE_FILE = "device_state.json"

class DeviceStateManager:
    """设备状态管理器 - 支持保存最近连接的设备和历史记录"""
    
    def __init__(self, storage_dir: str = "storage", max_history: int = 10):
        """
        初始化状态管理器
        
        Args:
            storage_dir: 存储目录
            max_history: 最多保存的历史连接记录数量
        """
        self.storage_dir = storage_dir
        self.state_path = os.path.join(storage_dir, STATE_FILE)
        self.max_history = max_history
        os.makedirs(storage_dir, exist_ok=True)
    
    def save_state(self, device_info: Dict) -> bool:
        """
        保存设备状态（同时更新历史记录）
        
        Args:
            device_info: 设备信息字典，包含：
                - type: 设备类型
                - ip_address: IP地址
                - port: 端口
                - resource_name: VISA资源名称
                
        Returns:
            是否保存成功
        """
        try:
            # 加载现有状态
            current_state = self._load_full_state()
            
            # 添加时间戳
            device_info_with_time = device_info.copy()
            device_info_with_time['timestamp'] = datetime.now().isoformat()
            device_info_with_time['last_connected'] = datetime.now().isoformat()
            
            # 更新最近连接的设备
            current_state['last_device'] = device_info_with_time
            
            # 更新历史记录
            history = current_state.get('history', [])
            
            # 创建唯一标识（设备类型 + IP + 端口）
            device_key = f"{device_info['type']}:{device_info['ip_address']}:{device_info['port']}"
            
            # 移除历史记录中相同的设备（如果存在）
            history = [
                h for h in history 
                if not (h.get('type') == device_info['type'] and 
                       h.get('ip_address') == device_info['ip_address'] and 
                       h.get('port') == device_info['port'])
            ]
            
            # 将当前设备添加到历史记录的开头
            history.insert(0, device_info_with_time)
            
            # 保持历史记录数量在限制内
            if len(history) > self.max_history:
                history = history[:self.max_history]
            
            current_state['history'] = history
            
            # 保存到文件
            with open(self.state_path, 'w', encoding='utf-8') as f:
                json.dump(current_state, f, ensure_ascii=False, indent=2)
            
            print(f"[保存] 已保存设备连接信息: {device_info['type']} @ {device_info['ip_address']}:{device_info['port']}")
            return True
        except Exception as e:
            print(f"[错误] 保存设备状态失败: {e}")
            return False
    
    def load_state(self) -> Optional[Dict]:
        """
        加载最近连接的设备状态
        
        Returns:
            设备信息字典，如果没有保存的状态则返回 None
        """
        try:
            state = self._load_full_state()
            return state.get('last_device')
        except Exception as e:
            print(f"[错误] 加载设备状态失败: {e}")
            return None
    
    def get_connection_history(self) -> List[Dict]:
        """
        获取历史连接记录
        
        Returns:
            历史连接记录列表，按时间倒序排列
        """
        try:
            state = self._load_full_state()
            history = state.get('history', [])
            
            # 格式化返回的历史记录，添加友好的显示名称
            formatted_history = []
            for item in history:
                formatted_item = item.copy()
                # 添加显示名称
                device_type_name = self._get_device_type_name(item.get('type', ''))
                formatted_item['display_name'] = f"{device_type_name} ({item.get('ip_address', '')}:{item.get('port', 5025)})"
                formatted_history.append(formatted_item)
            
            return formatted_history
        except Exception as e:
            print(f"[错误] 获取历史记录失败: {e}")
            return []
    
    def clear_state(self) -> bool:
        """
        清除保存的状态（包括历史记录）
        
        Returns:
            是否清除成功
        """
        try:
            if os.path.exists(self.state_path):
                os.remove(self.state_path)
            print("[清除] 已清除所有设备连接记录")
            return True
        except Exception as e:
            print(f"[错误] 清除设备状态失败: {e}")
            return False
    
    def remove_from_history(self, ip_address: str, port: int) -> bool:
        """
        从历史记录中移除指定的连接
        
        Args:
            ip_address: IP地址
            port: 端口号
            
        Returns:
            是否移除成功
        """
        try:
            state = self._load_full_state()
            history = state.get('history', [])
            
            # 过滤掉匹配的记录
            new_history = [
                h for h in history 
                if not (h.get('ip_address') == ip_address and h.get('port') == port)
            ]
            
            if len(new_history) < len(history):
                state['history'] = new_history
                with open(self.state_path, 'w', encoding='utf-8') as f:
                    json.dump(state, f, ensure_ascii=False, indent=2)
                print(f"[移除] 已从历史记录中移除: {ip_address}:{port}")
                return True
            else:
                print(f"[警告] 历史记录中未找到: {ip_address}:{port}")
                return False
        except Exception as e:
            print(f"[错误] 移除历史记录失败: {e}")
            return False
    
    def _load_full_state(self) -> Dict:
        """
        加载完整的状态文件
        
        Returns:
            完整的状态字典
        """
        if not os.path.exists(self.state_path):
            return {
                'last_device': None,
                'history': []
            }
        
        try:
            with open(self.state_path, 'r', encoding='utf-8') as f:
                state = json.load(f)
            
            # 确保有必要的键
            if 'history' not in state:
                state['history'] = []
            if 'last_device' not in state:
                state['last_device'] = state.get('device')  # 兼容旧格式
            
            return state
        except Exception as e:
            print(f"[警告] 加载状态文件失败: {e}，返回空状态")
            return {
                'last_device': None,
                'history': []
            }
    
    def _get_device_type_name(self, device_type: str) -> str:
        """
        获取设备类型的友好名称
        
        Args:
            device_type: 设备类型ID
            
        Returns:
            友好的设备名称
        """
        device_names = {
            'siyi-3674l': '思仪 3674L',
            'rohde-zna26': '罗德 ZNA26',
        }
        return device_names.get(device_type, device_type)


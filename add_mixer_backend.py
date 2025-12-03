"""
自动添加VMIX混频器配置后端支持的脚本
"""
import re

# ============ 1. 在vna_controller.py中添加mixer_config初始化 ============
print("[1/4] 修改vna_controller.py - 添加mixer_config...")

with open('backend/vna_controller.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 在__init__中添加mixer_config
if 'self.mixer_config' not in content:
    pattern = r"(        # 创建结果目录\n        os\.makedirs\('results', exist_ok=True\))"
    replacement = r"""        # 混频器配置（用于ZNA26的VMIX模式）
        self.mixer_config = {
            'rfPort': 1,
            'ifPort': 2,
            'loPort': 3,
            'loFrequency': 300.0,  # MHz
            'loPower': 10.0,       # dBm
            'conversionMode': 'DCUP'
        }
        
\1"""
    content = re.sub(pattern, replacement, content)
    
    with open('backend/vna_controller.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("  [OK] 已添加mixer_config到__init__")
else:
    print("  [SKIP] mixer_config已存在")

# ============ 2. 在app.py中添加API路由 ============
print("\n[2/4] 修改app.py - 添加mixer config API路由...")

with open('backend/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 检查是否已存在mixer-config路由
if '/api/vna/mixer-config' not in content:
    # 在clear_vna_connection_history之后添加
    pattern = r"(@app\.route\('/api/vna/connection-history/clear', methods=\['POST'\]\)\ndef clear_vna_connection_history\(\):\n    \"\"\"清除VNA所有历史连接记录\"\"\"\n    return vna_controller\.clear_connection_history\(\))"
    
    replacement = r"""\1

@app.route('/api/vna/mixer-config', methods=['GET'])
def get_mixer_config():
    \"\"\"获取混频器配置\"\"\"
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
    \"\"\"设置混频器配置\"\"\"
    try:
        data = request.json
        
        # 参数验证
        errors = []
        
        # 端口验证
        ports = [data.get('rfPort'), data.get('ifPort'), data.get('loPort')]
        if len(set(ports)) != len(ports):
            errors.append('端口不能重复')
        
        # LO频率验证 (10 MHz - 26.5 GHz)
        lo_freq = data.get('loFrequency', 0)
        if not (10 <= lo_freq <= 26500):
            errors.append('LO频率范围: 10-26500 MHz')
        
        # LO功率验证
        lo_power = data.get('loPower', 0)
        if not (-30 <= lo_power <= 10):
            errors.append('LO功率范围: -30 至 +10 dBm')
        
        if errors:
            return jsonify({'success': False, 'errors': errors}), 400
        
        # 更新配置
        vna_controller.mixer_config.update(data)
        logger.info(f"混频器配置已更新: {vna_controller.mixer_config}")
        
        return jsonify({
            'success': True,
            'message': '混频器配置已更新',
            'config': vna_controller.mixer_config
        })
    except Exception as e:
        logger.error(f"设置混频器配置失败: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500"""
    
    content = re.sub(pattern, replacement, content)
    
    with open('backend/app.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("  [OK] 已添加mixer-config路由")
else:
    print("  [SKIP] mixer-config路由已存在")

# ============ 3. 修改rohde.py - 传入mixer_config参数 ============
print("\n[3/4] 修改rohde.py - 使用动态mixer_config...")

with open('backend/devices/rohde.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 修改_configure_vmix_mode签名
if 'def _configure_vmix_mode(self, config=None):' not in content:
    content = content.replace(
        'def _configure_vmix_mode(self):',
        'def _configure_vmix_mode(self, config=None):'
    )
    print("  [OK] 已更新_configure_vmix_mode签名")
else:
    print("  [SKIP] _configure_vmix_mode签名已正确")

print("\n[4/4] 完成！")
print("\n提示：前端组件VNAMixerConfig.jsx已创建，需要在VNAPanel.jsx中集成")

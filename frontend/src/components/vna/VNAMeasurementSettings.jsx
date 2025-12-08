import { useEffect, useState } from 'react'
import { List } from 'lucide-react'
import { useVNA } from '../../contexts/VNAContext'
import BasicParametersTab from './tabs/BasicParametersTab'
import MixerMeasurementTab from './tabs/MixerMeasurementTab'
import PowerMeasurementTab from './tabs/PowerMeasurementTab'

/**
 * VNA测量设置统一组件 - Tab模式 (Claude风格)
 * 整合基本参数、混频器测量和功率测量
 */
function VNAMeasurementSettings() {
    const { activeMeasurementTab, setActiveMeasurementTab, selectedParameters, setSelectedParameters } = useVNA()
    const [isTabChanging, setIsTabChanging] = useState(false)

    const tabs = [
        { id: 'basic', label: '基本参数', description: 'S参数测量' },
        { id: 'mixer', label: '混频器测量', description: 'SC参数+配置' },
        { id: 'power', label: '功率测量', description: '暂不可用' }
    ]

    // 从localStorage恢复上次选择的Tab
    useEffect(() => {
        const savedTab = localStorage.getItem('vna_active_tab')
        if (savedTab && ['basic', 'mixer', 'power'].includes(savedTab)) {
            setActiveMeasurementTab(savedTab)
        }
    }, [setActiveMeasurementTab])

    // 保存Tab选择到localStorage
    useEffect(() => {
        if (activeMeasurementTab) {
            localStorage.setItem('vna_active_tab', activeMeasurementTab)
        }
    }, [activeMeasurementTab])

    // Tab切换时处理参数冲突
    useEffect(() => {
        if (activeMeasurementTab === 'basic') {
            setSelectedParameters(prev => prev.filter(p =>
                ['S11', 'S12', 'S21', 'S22'].includes(p)
            ))
        } else if (activeMeasurementTab === 'mixer') {
            setSelectedParameters(prev => prev.filter(p =>
                p.startsWith('SC')
            ))
        } else if (activeMeasurementTab === 'power') {
            setSelectedParameters(prev => prev.filter(p =>
                p.endsWith('PWR') || p.endsWith('Pwr')
            ))
        }
    }, [activeMeasurementTab, setSelectedParameters])

    // 处理Tab切换（带动画）
    const handleTabChange = (newTab) => {
        if (newTab !== activeMeasurementTab) {
            setIsTabChanging(true)
            setTimeout(() => {
                setActiveMeasurementTab(newTab)
                setIsTabChanging(false)
            }, 150)
        }
    }

    return (
        <div className="card-vna">
            {/* Tab Header */}
            <div className="border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center space-x-2">
                        <List className="h-5 w-5" style={{ color: 'var(--vna-primary)' }} />
                        <h2 className="font-heading" style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--weight-semibold)',
                            color: 'var(--text-primary)'
                        }}>测量设置</h2>
                    </div>
                    {/* 快捷按钮组 */}
                    <div className="flex gap-1">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className="w-7 h-7 text-xs font-semibold rounded"
                                style={{
                                    backgroundColor: activeMeasurementTab === tab.id ? 'var(--vna-primary)' : 'var(--bg-secondary)',
                                    color: activeMeasurementTab === tab.id ? '#FFF' : 'var(--text-tertiary)',
                                    transition: 'all var(--transition-base)',
                                    boxShadow: activeMeasurementTab === tab.id ? 'var(--glow-subtle)' : 'none',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeMeasurementTab !== tab.id) {
                                        e.target.style.backgroundColor = 'var(--bg-elevated)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeMeasurementTab !== tab.id) {
                                        e.target.style.backgroundColor = 'var(--bg-secondary)'
                                    }
                                }}
                                title={tab.label}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tab-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`tab-item ${activeMeasurementTab === tab.id ? 'tab-item-active' : ''}`}
                        >
                            <div className="flex flex-col items-center">
                                <span>{tab.label}</span>
                                <span style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-tertiary)'
                                }}>
                                    {tab.description}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content with fade-in animation */}
            <div className="p-5" style={{
                opacity: isTabChanging ? 0 : 1,
                transition: 'opacity var(--transition-base)'
            }}>
                {activeMeasurementTab === 'basic' && <BasicParametersTab />}
                {activeMeasurementTab === 'mixer' && <MixerMeasurementTab />}
                {activeMeasurementTab === 'power' && <PowerMeasurementTab />}
            </div>
        </div>
    )
}

export default VNAMeasurementSettings

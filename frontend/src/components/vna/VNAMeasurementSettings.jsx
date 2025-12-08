import { useEffect, useState } from 'react'
import { List } from 'lucide-react'
import { useVNA } from '../../contexts/VNAContext'
import BasicParametersTab from './tabs/BasicParametersTab'
import MixerMeasurementTab from './tabs/MixerMeasurementTab'
import PowerMeasurementTab from './tabs/PowerMeasurementTab'

/**
 * VNA测量设置统一组件 - Tab模式
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
    }, [])

    // 保存Tab选择到localStorage
    useEffect(() => {
        if (activeMeasurementTab) {
            localStorage.setItem('vna_active_tab', activeMeasurementTab)
        }
    }, [activeMeasurementTab])

    // Tab切换时处理参数冲突
    useEffect(() => {
        if (activeMeasurementTab === 'basic') {
            // 基本参数Tab：只保留S参数
            setSelectedParameters(prev => prev.filter(p =>
                ['S11', 'S12', 'S21', 'S22'].includes(p)
            ))
        } else if (activeMeasurementTab === 'mixer') {
            // 混频器Tab：只保留SC参数
            setSelectedParameters(prev => prev.filter(p =>
                p.startsWith('SC')
            ))
        } else if (activeMeasurementTab === 'power') {
            // 功率Tab：只保留功率参数
            setSelectedParameters(prev => prev.filter(p =>
                p.endsWith('PWR') || p.endsWith('Pwr')
            ))
        }
    }, [activeMeasurementTab])

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700">
            {/* Tab Header */}
            <div className="border-b border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center space-x-2">
                        <List className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">测量设置</h2>
                    </div>
                    {/* 快捷按钮组 */}
                    <div className="flex gap-1">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`w-7 h-7 text-xs font-semibold rounded transition-colors ${activeMeasurementTab === tab.id
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-600'
                                    }`}
                                title={tab.label}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-2 font-medium text-sm transition-all relative ${activeMeasurementTab === tab.id
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                                }`}
                        >
                            <div className="flex flex-col items-center">
                                <span>{tab.label}</span>
                                <span className="text-[10px] text-slate-400 dark:text-gray-500">
                                    {tab.description}
                                </span>
                            </div>
                            {/* Active indicator with slide animation */}
                            {activeMeasurementTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 transition-all duration-300" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content with fade-in animation */}
            <div className={`p-5 transition-opacity duration-200 ${isTabChanging ? 'opacity-0' : 'opacity-100'}`}>
                {activeMeasurementTab === 'basic' && <BasicParametersTab />}
                {activeMeasurementTab === 'mixer' && <MixerMeasurementTab />}
                {activeMeasurementTab === 'power' && <PowerMeasurementTab />}
            </div>
        </div>
    )
}

export default VNAMeasurementSettings

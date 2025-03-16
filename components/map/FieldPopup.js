import React, { useState } from 'react';
import { Popup } from 'react-leaflet';
import TaskManager from './TaskManager';
import { calculateFieldArea } from './utils/areaCalculations';
import { generateFieldReport } from './utils/reportGenerator';

function FieldPopup({ 
    id, 
    popup, 
    temperature, 
    fieldTasks, 
    setFieldTasks,
    handleClosePopup, 
    updateCropName, 
    updatePlantingDate, 
    getAIRecommendations,
    fetchCommunityTips,
    handleEraseArea
}) {
    const [activeTab, setActiveTab] = useState('general');
    
    return (
        <Popup 
            key={`popup-${id}`} 
            position={popup.position} 
            onClose={() => handleClosePopup(id)}
            className="enhanced-popup"
            maxWidth={500}
        >
            <div style={{ minWidth: '350px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: '0 0 10px' }}>Crop Management</h2>
                    <div style={{ textAlign: 'right' }}>
                        Temperature: {temperature}°C
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    borderBottom: '1px solid #ddd',
                    marginBottom: '10px' 
                }}>
                    <TabButton 
                        active={activeTab === 'general'} 
                        onClick={() => setActiveTab('general')}
                        label="General"
                    />
                    <TabButton 
                        active={activeTab === 'tasks'} 
                        onClick={() => setActiveTab('tasks')}
                        label="Tasks"
                    />
                    <TabButton 
                        active={activeTab === 'ai'} 
                        onClick={() => setActiveTab('ai')}
                        label="AI Insights"
                    />
                </div>

                {activeTab === 'general' && (
                    <div>
                        <label style={labelStyle}>
                            Crop Name:
                            <input
                                type="text"
                                value={popup.cropName}
                                onChange={(e) => updateCropName(id, e.target.value)}
                                style={inputStyle}
                            />
                        </label>
                        
                        <label style={labelStyle}>
                            Planting Date:
                            <input
                                type="date"
                                value={popup.plantingDate}
                                onChange={(e) => updatePlantingDate(id, e.target.value)}
                                style={inputStyle}
                            />
                        </label>
                        
                        <div style={{ margin: '10px 0' }}>
                            <strong>Field Area:</strong> {calculateFieldArea(popup.area)} hectares
                        </div>
                        
                        <div style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
                            <button 
                                onClick={() => fetchCommunityTips(popup.cropName)}
                                style={buttonStyle}
                            >
                                View Community Tips
                            </button>
                            <button 
                                onClick={() => handleEraseArea(id)}
                                style={{...buttonStyle, backgroundColor: '#f44336'}}
                            >
                                Delete Field
                            </button>
                        </div>
                    </div>
                )}
                
                {activeTab === 'tasks' && (
                    <TaskManager 
                        fieldId={id} 
                        tasks={fieldTasks[id] || []} 
                        setFieldTasks={setFieldTasks}
                    />
                )}
                
                {activeTab === 'ai' && (
                    <div>
                        <div>
                            <h3 style={{ margin: '5px 0' }}>AI Recommendations</h3>
                            <div 
                                style={{ 
                                    maxHeight: '200px', 
                                    overflowY: 'scroll', 
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    marginBottom: '10px'
                                }} 
                                dangerouslySetInnerHTML={{ __html: popup.aiRecommendations || '<p>No recommendations yet</p>' }} 
                            />
                            <button 
                                onClick={() => getAIRecommendations(id)}
                                style={buttonStyle}
                            >
                                Get Recommendations
                            </button>
                        </div>
                        
                        <div style={{ marginTop: '15px' }}>
                            <button 
                                onClick={() => generateFieldReport(popup)}
                                style={buttonStyle}
                            >
                                Generate Field Report
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Popup>
    );
}

// Helper component for tab buttons
const TabButton = ({ active, onClick, label }) => (
    <button 
        onClick={onClick}
        style={{
            padding: '8px 12px',
            backgroundColor: active ? '#f0f8ff' : 'transparent',
            border: 'none',
            borderBottom: active ? '2px solid #4CAF50' : 'none',
            cursor: 'pointer',
            fontWeight: active ? 'bold' : 'normal'
        }}
    >
        {label}
    </button>
);

// Styles
const labelStyle = { 
    display: 'block', 
    margin: '10px 0' 
};

const inputStyle = { 
    display: 'block', 
    width: '100%', 
    padding: '5px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ddd'
};

const buttonStyle = {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer'
};

export default FieldPopup;
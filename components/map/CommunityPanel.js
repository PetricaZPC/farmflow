import React, { useState } from 'react';

function CommunityPanel({ 
    activeCrop, 
    communityTips, 
    newTip, 
    setNewTip, 
    shareTip, 
    setShowCommunityPanel 
}) {
    return (
        <div className="community-panel" style={{
            position: 'absolute',
            right: '20px',
            top: '80px',
            width: '320px',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 1000
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 10px' }}>Community Tips for {activeCrop}</h3>
                <button 
                    onClick={() => setShowCommunityPanel(false)}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        fontSize: '20px',
                        cursor: 'pointer'
                    }}
                >
                    ×
                </button>
            </div>
            
            <div className="tip-list">
                {communityTips.length > 0 ? (
                    communityTips.map((tip, i) => (
                        <div key={i} style={{ 
                            border: '1px solid #e0e0e0',
                            borderRadius: '5px',
                            padding: '10px',
                            marginBottom: '10px'
                        }}>
                            <p style={{ marginTop: 0 }}>{tip.content}</p>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '0.85rem',
                                color: '#666'
                            }}>
                                <span>By: {tip.author || 'Anonymous'}</span>
                                {tip.rating && <span>Rating: {tip.rating}/5</span>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No tips yet for {activeCrop}. Be the first to share!</p>
                )}
            </div>
            
            <div style={{ marginTop: '15px' }}>
                <textarea 
                    value={newTip} 
                    onChange={(e) => setNewTip(e.target.value)}
                    placeholder={`Share your experience growing ${activeCrop}...`}
                    style={{ 
                        width: '100%', 
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        minHeight: '80px'
                    }}
                />
                <button 
                    onClick={shareTip}
                    style={{ 
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        float: 'right'
                    }}
                >
                    Share Tip
                </button>
            </div>
        </div>
    );
}

export default CommunityPanel;
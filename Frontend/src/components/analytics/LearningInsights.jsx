import React from 'react';
import { Card, List, Tag, Typography, Divider, Tooltip } from 'antd';
import { 
  BulbOutlined, 
  TrophyOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const InsightCard = ({ title, icon, children, color = '#1890ff' }) => (
  <Card className="insight-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="insight-header">
      {React.cloneElement(icon, { 
        style: { color, fontSize: '20px', marginRight: '12px' } 
      })}
      <Title level={5} style={{ margin: 0, color }}>{title}</Title>
    </div>
    <div className="insight-content">
      {children}
    </div>
  </Card>
);

const LearningInsights = ({ insights, strengths = [], areasForImprovement = [] }) => {
  if (!insights && !strengths?.length && !areasForImprovement?.length) {
    return (
      <Card className="insights-container">
        <Empty description="No insights available yet. Complete some lessons to see personalized recommendations." />
      </Card>
    );
  }

  return (
    <div className="insights-container">
      {insights?.length > 0 && (
        <>
          <Title level={4} style={{ marginBottom: 16 }}>
            <BulbOutlined style={{ marginRight: 8 }} />
            Personalized Insights
          </Title>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <InsightCard 
                key={`insight-${index}`}
                title="Learning Insight"
                icon={<BulbOutlined />}
                color="#13c2c2"
              >
                <Paragraph style={{ margin: 0 }}>{insight}</Paragraph>
              </InsightCard>
            ))}
          </div>
          <Divider />
        </>
      )}

      {strengths?.length > 0 && (
        <div className="strengths-section">
          <Title level={4} style={{ marginBottom: 16 }}>
            <TrophyOutlined style={{ marginRight: 8 }} />
            Your Strengths
          </Title>
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
            dataSource={strengths}
            renderItem={(item) => (
              <List.Item>
                <Card className="strength-card">
                  <div className="strength-header">
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text strong>{item.category}</Text>
                  </div>
                  <div className="strength-metric">
                    <Text type="success">{item.accuracy}% accuracy</Text>
                  </div>
                  <Text type="secondary" className="strength-tip">
                    You're excelling in this area! Keep up the great work.
                  </Text>
                </Card>
              </List.Item>
            )}
          />
          <Divider />
        </div>
      )}

      {areasForImprovement?.length > 0 && (
        <div className="improvement-section">
          <Title level={4} style={{ marginBottom: 16 }}>
            <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Areas for Improvement
          </Title>
          <List
            itemLayout="vertical"
            dataSource={areasForImprovement}
            renderItem={(item) => (
              <List.Item>
                <Card className="improvement-card">
                  <div className="improvement-header">
                    <Text strong>{item.category}</Text>
                    {item.accuracy !== undefined && (
                      <Tag color="warning">{item.accuracy}% accuracy</Tag>
                    )}
                    {item.count && (
                      <Tag color="default">{item.count} incomplete</Tag>
                    )}
                  </div>
                  
                  {item.suggestions?.length > 0 && (
                    <div className="suggestions">
                      <Text strong>Suggestions:</Text>
                      <List
                        size="small"
                        dataSource={item.suggestions}
                        renderItem={(suggestion) => (
                          <List.Item>
                            <div className="suggestion-item">
                              <Text>• {suggestion}</Text>
                            </div>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </Card>
              </List.Item>
            )}
          />
        </div>
      )}

      <style jsx global>{`
        .insights-container {
          margin-bottom: 24px;
        }
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .insight-card {
          height: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }
        .insight-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .insight-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .strength-card, .improvement-card {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
          height: 100%;
        }
        .strength-card:hover, .improvement-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .strength-header, .improvement-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .strength-metric {
          margin: 8px 0;
        }
        .strength-tip {
          font-size: 12px;
          color: #8c8c8c;
        }
        .suggestions {
          margin-top: 12px;
        }
        .suggestion-item {
          display: flex;
          align-items: flex-start;
        }
        @media (max-width: 768px) {
          .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LearningInsights;

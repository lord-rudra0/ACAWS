import React from 'react';
import { Card, Progress, Typography, Row, Col, Tooltip } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  RiseOutlined, 
  BulbOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const MetricCard = ({ title, value, icon, color, tooltip }) => (
  <Card className="metric-card">
    <div className="metric-content">
      <div className="metric-icon" style={{ backgroundColor: `${color}15` }}>
        {React.cloneElement(icon, { 
          style: { color, fontSize: '24px' } 
        })}
      </div>
      <div className="metric-info">
        <Text type="secondary" className="metric-title">
          {title}
          {tooltip && (
            <Tooltip title={tooltip}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#8c8c8c' }} />
            </Tooltip>
          )}
        </Text>
        <Title level={3} style={{ margin: '4px 0 0', color: color }}>
          {value}
        </Title>
      </div>
    </div>
  </Card>
);

const DashboardMetrics = ({ metrics }) => {
  if (!metrics) return null;

  const { progress, metrics: learningMetrics = {} } = metrics;
  
  return (
    <div className="dashboard-metrics">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Course Progress"
            value={`${Math.round(progress?.completionPercentage || 0)}%`}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
            tooltip="Your overall completion percentage for this course"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Engagement Score"
            value={`${learningMetrics.engagementScore || 0}/100`}
            icon={<RiseOutlined />}
            color="#1890ff"
            tooltip="Measures your active participation and time spent"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Learning Velocity"
            value={`${learningMetrics.learningVelocity || 0}/day`}
            icon={<ClockCircleOutlined />}
            color="#722ed1"
            tooltip="Average number of lessons completed per day"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Knowledge Retention"
            value={`${learningMetrics.retentionRate || 0}%`}
            icon={<BulbOutlined />}
            color="#13c2c2"
            tooltip="Your ability to retain and recall information over time"
          />
        </Col>
      </Row>
      
      <style jsx global>{`
        .dashboard-metrics {
          margin-bottom: 24px;
        }
        .metric-card {
          height: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }
        .metric-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .metric-content {
          display: flex;
          align-items: center;
        }
        .metric-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          margin-right: 16px;
        }
        .metric-info {
          flex: 1;
        }
        .metric-title {
          display: flex;
          align-items: center;
          font-size: 14px;
          margin-bottom: 0;
        }
        @media (max-width: 768px) {
          .metric-card {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardMetrics;

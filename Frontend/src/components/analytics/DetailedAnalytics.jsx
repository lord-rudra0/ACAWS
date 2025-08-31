import React from 'react';
import { Card, Row, Col, Typography, Table, Tag, Progress, Empty } from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const { Title, Text } = Typography;

// Data comes from props (metrics). Provide sensible defaults.

const activityTypeColor = {
  lesson: 'blue',
  quiz: 'green',
  video: 'purple',
  assignment: 'orange'
};

const DetailedAnalytics = ({ metrics = {} }) => {
  const timeSpentData = Array.isArray(metrics.timeSpentByDay)
    ? metrics.timeSpentByDay.map(d => ({
        name: d?.label || d?.day || d?.date || '',
        minutes: Number(d?.minutes ?? d?.timeSpent ?? 0)
      }))
    : [];

  const scoreData = Array.isArray(metrics.assessmentScores)
    ? metrics.assessmentScores.map(s => ({
        name: s?.name || s?.label || s?.assessment || 'Assessment',
        score: Number(s?.score ?? 0),
        fullMark: Number(s?.fullMark ?? s?.max ?? 100)
      }))
    : [];

  const subjectData = Array.isArray(metrics.subjectPerformance)
    ? metrics.subjectPerformance.map(s => ({
        subject: s?.subject || s?.name || 'Subject',
        A: Number(s?.score ?? s?.value ?? 0),
        fullMark: Number(s?.fullMark ?? 100)
      }))
    : [];

  const completion = metrics.completion || metrics.progress || {};
  const overallPercent = Math.round(Number(
    completion.overall ?? completion.completionPercentage ?? 0
  ));
  const cat = {
    lessons: Math.round(Number(completion.lessons ?? 0)),
    quizzes: Math.round(Number(completion.quizzes ?? 0)),
    assignments: Math.round(Number(completion.assignments ?? 0)),
    videos: Math.round(Number(completion.videos ?? 0)),
  };

  const recentActivities = Array.isArray(metrics.recentActivities)
    ? metrics.recentActivities.map((a, idx) => ({
        key: a?.id || a?._id || String(idx),
        activity: a?.title || a?.activity || a?.name || 'Activity',
        score: a?.score ? `${a.score}%` : a?.scoreText,
        time: a?.time || a?.when || a?.date || '',
        type: a?.type || 'lesson'
      }))
    : [];

  const columns = [
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      render: (text, record) => (
        <div>
          <Tag color={activityTypeColor[record.type]}>{record.type.toUpperCase()}</Tag>
          {text}
        </div>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score) => score || '--',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
  ];

  return (
    <div className="detailed-analytics">
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={12}>
          <Card title="Time Spent (Last Period)">
            {timeSpentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeSpentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="minutes" fill="#1890ff" name="Minutes Spent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No time-spent data" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Assessment Scores">
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#52c41a" name="Your Score" />
                  <Line type="monotone" dataKey="fullMark" stroke="#f5222d" name="Max Score" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No assessment data" />
            )}
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={12}>
          <Card title="Subject Performance">
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Your Score" dataKey="A" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No subject performance data" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Completion Rate">
            {overallPercent > 0 ? (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Progress 
                  type="dashboard" 
                  percent={overallPercent} 
                  width={200} 
                  strokeColor="#52c41a"
                  format={percent => `${percent}% Complete`}
                />
              </div>
            ) : (
              <Empty description="No completion data" />
            )}
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={4}>Lessons</Title>
                  <Progress percent={cat.lessons} status="active" />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={4}>Quizzes</Title>
                  <Progress percent={cat.quizzes} status="active" />
                </div>
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={4}>Assignments</Title>
                  <Progress percent={cat.assignments} status="active" />
                </div>
              </Col>
              <Col span={12} style={{ marginTop: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={4}>Videos</Title>
                  <Progress percent={cat.videos} status="active" />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      <Card title="Recent Activities" className="mb-4">
        {recentActivities.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={recentActivities} 
            pagination={false}
            size="middle"
          />
        ) : (
          <Empty description="No recent activities" />
        )}
      </Card>
      
      <style jsx global>{`
        .detailed-analytics .ant-card {
          margin-bottom: 16px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        }
        
        .detailed-analytics .ant-card-head-title {
          font-weight: 500;
        }
        
        .detailed-analytics .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .detailed-analytics .ant-col {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default DetailedAnalytics;

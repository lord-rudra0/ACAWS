import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Spin, message, Empty, Button, Select, DatePicker } from 'antd';
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  BulbOutlined,
  BookOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import DashboardMetrics from '../components/analytics/DashboardMetrics';
import ProgressChart from '../components/analytics/ProgressChart';
import LearningInsights from '../components/analytics/LearningInsights';
import DetailedAnalytics from '../components/analytics/DetailedAnalytics';
import * as analyticsApi from '../utils/analyticsApi';
import { format, subDays } from 'date-fns';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const AnalyticsDashboard = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState([
    subDays(new Date(), 7),
    new Date()
  ]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(!refreshing);
      setError(null);
      
      let data;
      if (moduleId) {
        data = await analyticsApi.fetchModuleAnalytics(moduleId, {
          startDate: dateRange[0],
          endDate: dateRange[1]
        });
      } else {
        data = await analyticsApi.fetchDashboardAnalytics({
          timeRange,
          startDate: dateRange[0],
          endDate: dateRange[1]
        });
      }
      
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load analytics data. Please try again later.';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moduleId, timeRange, dateRange, refreshing]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    if (value !== 'custom') {
      const days = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365
      }[value] || 7;
      
      setDateRange([
        subDays(new Date(), days),
        new Date()
      ]);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      setTimeRange('custom');
    }
  };

  const renderLoading = () => (
    <div className="loading-container">
      <Spin size="large" />
      <p>{refreshing ? 'Refreshing data...' : 'Loading your learning analytics...'}</p>
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
          text-align: center;
        }
      `}</style>
    </div>
  );

  const renderHeader = () => (
    <div className="analytics-header">
      <div className="header-left">
        {moduleId && (
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            Back
          </Button>
        )}
        <h1 className="page-title">
          {moduleId ? 'Module Analytics' : 'Learning Analytics Dashboard'}
        </h1>
      </div>
      
      <div className="header-controls">
        {!moduleId && (
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            style={{ width: 120, marginRight: 8 }}
            prefixCls="time-range-select"
            suffixIcon={<CalendarOutlined />}
          >
            <Option value="week">Last 7 days</Option>
            <Option value="month">Last 30 days</Option>
            <Option value="quarter">Last 90 days</Option>
            <Option value="year">Last year</Option>
            <Option value="custom">Custom Range</Option>
          </Select>
        )}
        
        <RangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          style={{ marginRight: 8, width: 250 }}
          disabled={timeRange !== 'custom'}
        />
        
        <Button 
          type="primary" 
          icon={<ReloadOutlined spin={refreshing} />} 
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>
    </div>
  );

  if (loading && !refreshing) {
    return renderLoading();
  }

  if (error) {
    return (
      <Card>
        <Empty 
          description={
            <span style={{ color: '#ff4d4f' }}>{error}</span>
          }
        />
      </Card>
    );
  }

  const { progress = {}, metrics = {} } = analyticsData || {};

  return (
    <div className="analytics-dashboard">
      {renderHeader()}
      
      {refreshing ? (
        renderLoading()
      ) : (
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          className="analytics-tabs"
          tabBarExtraContent={
            <div className="tab-extra">
              <span className="last-updated">
                Last updated: {analyticsData?.lastUpdated ? 
                  format(new Date(analyticsData.lastUpdated), 'MMM d, yyyy h:mm a') : 
                  'Just now'}
              </span>
            </div>
          }
        >
          <TabPane
            tab={
              <span>
                <DashboardOutlined />
                Overview
              </span>
            }
            key="overview"
          >
            <DashboardMetrics metrics={analyticsData} />
            <ProgressChart 
              progressData={progress.history || []} 
              className="progress-chart"
            />
            <LearningInsights 
              insights={metrics.insights}
              strengths={metrics.strengths}
              areasForImprovement={metrics.areasForImprovement}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Detailed Analytics
              </span>
            }
            key="detailed"
          >
            <DetailedAnalytics metrics={metrics} />
          </TabPane>

          {moduleId && (
            <TabPane
              tab={
                <span>
                  <BookOutlined />
                  Module Content
                </span>
              }
              key="module"
            >
              <Card className="module-content">
                <h3>Module Content Progress</h3>
                <p>Module-specific content and progress tracking coming soon...</p>
              </Card>
            </TabPane>
          )}
        </Tabs>
      )}

      <style jsx global>{`
        .analytics-dashboard {
          padding: 24px;
          background: #f0f2f5;
          min-height: calc(100vh - 64px);
        }
        
        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .back-button {
          margin-right: 8px;
        }
        
        .page-title {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.85);
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .analytics-tabs .ant-tabs-nav {
          margin: 0 0 24px 0;
        }
        
        .analytics-tabs .ant-tabs-tab {
          font-size: 15px;
          padding: 12px 20px;
          transition: all 0.2s;
        }
        
        .analytics-tabs .ant-tabs-tab-active {
          font-weight: 500;
        }
        
        .analytics-tabs .ant-tabs-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .progress-chart {
          margin: 24px 0;
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        }
        
        .module-content {
          margin-bottom: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          background: #fff;
        }
        
        .tab-extra {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .last-updated {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.45);
        }
        
        @media (max-width: 992px) {
          .analytics-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-controls {
            width: 100%;
            margin-top: 12px;
          }
          
          .header-controls > * {
            flex: 1;
            min-width: 120px;
          }
        }
        
        @media (max-width: 768px) {
          .analytics-dashboard {
            padding: 16px 12px;
          }
          
          .analytics-tabs .ant-tabs-tab {
            font-size: 14px;
            padding: 8px 12px;
          }
          
          .header-controls {
            flex-direction: column;
            gap: 12px;
          }
          
          .header-controls > * {
            width: 100%;
          }
          
          .ant-picker-range {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;

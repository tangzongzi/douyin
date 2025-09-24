'use client';

import { Button, Space, DatePicker, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface TimeFilterProps {
  onTimeRangeChange: (range: string, startDate?: string, endDate?: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function TimeFilter({ onTimeRangeChange, onRefresh, loading = false }: TimeFilterProps) {
  const handleQuickSelect = (range: string) => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (range) {
      case 'today':
        startDate = dayjs().format('YYYY-MM-DD');
        endDate = dayjs().format('YYYY-MM-DD');
        break;
      case 'week':
        startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
        endDate = dayjs().format('YYYY-MM-DD');
        break;
      case 'month':
        startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        endDate = dayjs().format('YYYY-MM-DD');
        break;
      case 'custom':
        // 自定义日期范围将在 DatePicker 中处理
        return;
    }

    onTimeRangeChange(range, startDate, endDate);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      onTimeRangeChange('custom', startDate, endDate);
    }
  };

  const handleRefresh = () => {
    onRefresh();
    message.success('数据已刷新');
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">时间范围：</span>
        <Space size="small">
          <Button 
            onClick={() => handleQuickSelect('today')}
            type="default"
            size="small"
            className="rounded-lg"
          >
            今日
          </Button>
          <Button 
            onClick={() => handleQuickSelect('week')}
            type="default"
            size="small"
            className="rounded-lg"
          >
            本月
          </Button>
          <Button 
            onClick={() => handleQuickSelect('month')}
            type="default"
            size="small"
            className="rounded-lg"
          >
            近30天
          </Button>
        </Space>
      </div>
      <div className="flex items-center gap-2">
        <DatePicker.RangePicker
          onChange={handleDateRangeChange}
          placeholder={['开始日期', '结束日期']}
          format="YYYY-MM-DD"
          size="small"
          className="rounded-lg"
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
          type="primary"
          size="small"
          className="rounded-lg"
        >
          刷新数据
        </Button>
      </div>
    </div>
  );
}

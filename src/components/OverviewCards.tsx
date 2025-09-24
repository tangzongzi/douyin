'use client';

import { Row, Col, Spin } from 'antd';
import StatCard from './StatCard';

interface OverviewCardsProps {
  data: {
    todayProfit?: number;
    yesterdayProfit?: number;
    monthProfit?: number;
    lastMonthProfit?: number;
    netCashflow?: number;
    lastMonthCashflow?: number;
    monthClaimAmount?: number;
    lastMonthClaimAmount?: number;
  };
  loading?: boolean;
}

export default function OverviewCards({ data, loading = false }: OverviewCardsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        title="当月盈利"
        value={data.monthProfit || 0}
        previousValue={data.lastMonthProfit}
        color="#1890ff"
      />
      <StatCard
        title="今日盈利"
        value={data.todayProfit || 0}
        previousValue={data.yesterdayProfit}
        color="#52c41a"
      />
      <StatCard
        title="累计净现金流"
        value={data.netCashflow || 0}
        previousValue={data.lastMonthCashflow}
        color="#722ed1"
      />
      <StatCard
        title="当月赔付申请"
        value={data.monthClaimAmount || 0}
        previousValue={data.lastMonthClaimAmount}
        color="#fa8c16"
      />
    </div>
  );
}

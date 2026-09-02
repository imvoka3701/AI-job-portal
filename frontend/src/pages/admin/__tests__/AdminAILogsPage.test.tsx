import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminAILogsPage } from '../AdminAILogsPage';
import * as adminAI from '@/lib/api/adminAI';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api/adminAI', () => ({
  getAIStats: vi.fn(),
  getAICallLogs: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
}));

// Mock ResizeObserver for Recharts
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

describe('AdminAILogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons initially', () => {
    (adminAI.getAIStats as any).mockImplementation(() => new Promise(() => {}));
    (adminAI.getAICallLogs as any).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminAILogsPage />
      </MemoryRouter>
    );
    
    expect(screen.getByText('AI Call Logs')).toBeInTheDocument();
    expect(screen.queryByText('Calls hôm nay')).not.toBeInTheDocument();
  });

  it('renders stats and logs successfully', async () => {
    (adminAI.getAIStats as any).mockResolvedValue({
      total_calls_today: 150,
      total_calls_week: 1000,
      total_cost_today_usd: 5.5,
      total_cost_month_usd: 120.0,
      total_cost_week_usd: 30.0,
      error_rate_pct: 2.5,
      by_feature: [
        { feature: 'cv_evaluate', total_calls: 100, success_calls: 95, failed_calls: 5, total_cost_usd: 2.5 }
      ]
    });

    (adminAI.getAICallLogs as any).mockResolvedValue({
      items: [
        {
          id: 'log-1',
          tenant_id: 'tenant-1',
          feature: 'cv_evaluate',
          model: 'gpt-4',
          status: 'success',
          input_tokens: 100,
          output_tokens: 50,
          cost_usd: 0.002,
          duration_ms: 1200,
          created_at: '2026-09-02T10:00:00Z',
        }
      ],
      total: 1,
      page: 1,
      page_size: 15,
      total_pages: 1
    });

    render(
      <MemoryRouter>
        <AdminAILogsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // total_calls_today
    });

    expect(screen.getAllByText('Đánh giá CV').length).toBeGreaterThan(0); // feature label
    expect(screen.getAllByText('Thành công').length).toBeGreaterThan(0); // status label
  });

  it('handles error state gracefully', async () => {
    (adminAI.getAIStats as any).mockRejectedValue(new Error('Network error'));
    (adminAI.getAICallLogs as any).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <AdminAILogsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Không thể tải dữ liệu biểu đồ')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Không thể tải danh sách logs')).toBeInTheDocument();
  });
});

import { useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Download, Calendar, ChevronDown } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  project: string;
  date: string;
  totalCases: number;
  pass: number;
  fail: number;
  skip: number;
  passRate: number;
}

const mockReports: Report[] = [
  { id: '1', name: '回归测试报告-202401', project: '电商交易系统', date: '2024-01-18', totalCases: 120, pass: 115, fail: 3, skip: 2, passRate: 95.8 },
  { id: '2', name: '功能测试报告-V2.1', project: '电商交易系统', date: '2024-01-15', totalCases: 85, pass: 80, fail: 3, skip: 2, passRate: 94.1 },
  { id: '3', name: '接口测试报告', project: '后台管理系统', date: '2024-01-14', totalCases: 200, pass: 195, fail: 5, skip: 0, passRate: 97.5 },
  { id: '4', name: 'UI测试报告', project: '移动端App', date: '2024-01-12', totalCases: 60, pass: 55, fail: 4, skip: 1, passRate: 91.7 },
];

const weeklyData = [
  { day: '周一', pass: 85, fail: 5 },
  { day: '周二', pass: 92, fail: 8 },
  { day: '周三', pass: 88, fail: 12 },
  { day: '周四', pass: 95, fail: 5 },
  { day: '周五', pass: 98, fail: 2 },
  { day: '周六', pass: 45, fail: 3 },
  { day: '周日', pass: 38, fail: 2 },
];

const failDetails = [
  { id: '1', caseName: '登录功能测试用例', module: '用户模块', reason: '网络超时', severity: '高' },
  { id: '2', caseName: '订单创建测试用例', module: '订单模块', reason: '数据库连接失败', severity: '高' },
  { id: '3', caseName: '支付功能测试用例', module: '支付模块', reason: '第三方接口异常', severity: '中' },
];

export default function TestResults() {
  const [selectedReport, setSelectedReport] = useState(mockReports[0]);

  const maxBarHeight = Math.max(...weeklyData.map(d => d.pass + d.fail));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">测试结果</h1>
          <p className="text-slate-500 mt-1">查看测试报告和分析结果</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          导出报告
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">测试用例总数</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{selectedReport.totalCases}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">通过数</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{selectedReport.pass}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">失败数</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{selectedReport.fail}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">通过率</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{selectedReport.passRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">测试报告列表</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {mockReports.map((report) => (
              <div 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`px-6 py-4 cursor-pointer transition-colors ${
                  selectedReport.id === report.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${
                      selectedReport.id === report.id ? 'text-blue-600' : 'text-slate-800'
                    }`}>{report.name}</p>
                    <p className="text-sm text-slate-500">{report.project} - {report.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        <span className="text-green-600 font-medium">{report.pass}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-600">{report.totalCases}</span>
                        <span className="text-slate-400"> 通过</span>
                      </p>
                      <p className="text-xs text-slate-500">通过率 {report.passRate}%</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 ${
                      selectedReport.id === report.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">本周趋势</h2>
            </div>
            <div className="p-4">
              <div className="flex items-end justify-between h-48 gap-2">
                {weeklyData.map((data) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1" style={{ height: '140px' }}>
                      <div 
                        className="w-full bg-green-500 rounded-t"
                        style={{ height: `${(data.pass / maxBarHeight) * 100}%` }}
                        title={`通过: ${data.pass}`}
                      ></div>
                      <div 
                        className="w-full bg-red-500 rounded-b"
                        style={{ height: `${(data.fail / maxBarHeight) * 100}%` }}
                        title={`失败: ${data.fail}`}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">{data.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-xs text-slate-500">通过</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-xs text-slate-500">失败</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">失败用例详情</h2>
            </div>
            <div className="p-4 space-y-3">
              {failDetails.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{item.caseName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.severity === '高' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{item.module}</p>
                  <p className="text-xs text-red-500 mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Play, PlayCircle, CheckCircle, XCircle, SkipForward, RefreshCw, Search, Filter } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface ExecutionCase {
  id: string;
  name: string;
  requirement: string;
  module: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'skip';
  progress: number;
}

export default function TestExecution() {
  const testCases = useAppStore(state => state.testCases);
  const [executionStates, setExecutionStates] = useState<Record<string, ExecutionCase>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const newStates: Record<string, ExecutionCase> = {};
    const existingCaseIds = new Set(testCases.map(tc => tc.id));
    
    testCases.forEach(tc => {
      if (!executionStates[tc.id]) {
        newStates[tc.id] = {
          id: tc.id,
          name: tc.name,
          requirement: tc.requirement,
          module: tc.module,
          status: 'pending' as const,
          progress: 0,
        };
      } else {
        newStates[tc.id] = {
          ...executionStates[tc.id],
          name: tc.name,
          requirement: tc.requirement,
          module: tc.module,
        };
      }
    });
    
    Object.keys(executionStates).forEach(id => {
      if (!existingCaseIds.has(id)) {
        delete newStates[id];
      }
    });
    
    setExecutionStates(newStates);
  }, [testCases]);

  const cases = Object.values(executionStates);

  const filteredCases = cases.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.requirement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startExecution = () => {
    setIsRunning(true);
    setExecutionStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].status === 'pending') {
          next[id] = { ...next[id], status: 'running' };
        }
      });
      return next;
    });
    
    setTimeout(() => {
      setExecutionStates(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (prev[id].status === 'pending' || prev[id].status === 'running') {
            const newStatus = Math.random() > 0.2 ? 'pass' as const : 'fail' as const;
            next[id] = { ...next[id], status: newStatus, progress: 100 };
          }
        });
        return next;
      });
      setIsRunning(false);
    }, 3000);
  };

  const runSingleCase = (caseId: string) => {
    setExecutionStates(prev => ({
      ...prev,
      [caseId]: { ...prev[caseId], status: 'running' }
    }));
    
    setTimeout(() => {
      setExecutionStates(prev => {
        const newStatus = Math.random() > 0.3 ? 'pass' as const : 'fail' as const;
        return {
          ...prev,
          [caseId]: { ...prev[caseId], status: newStatus, progress: 100 }
        };
      });
    }, 1500);
  };

  const skipCase = (caseId: string) => {
    setExecutionStates(prev => ({
      ...prev,
      [caseId]: { ...prev[caseId], status: 'skip', progress: 0 }
    }));
  };

  const resetCase = (caseId: string) => {
    setExecutionStates(prev => ({
      ...prev,
      [caseId]: { ...prev[caseId], status: 'pending', progress: 0 }
    }));
  };

  const passCount = cases.filter(c => c.status === 'pass').length;
  const failCount = cases.filter(c => c.status === 'fail').length;
  const skipCount = cases.filter(c => c.status === 'skip').length;
  const pendingCount = cases.filter(c => c.status === 'pending').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">测试执行</h1>
          <p className="text-slate-500 mt-1">执行测试用例并记录结果</p>
        </div>
        <button
          onClick={startExecution}
          disabled={isRunning}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              执行中...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              批量执行
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{passCount}</p>
              <p className="text-sm text-slate-500">通过</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{failCount}</p>
              <p className="text-sm text-slate-500">失败</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <SkipForward className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{skipCount}</p>
              <p className="text-sm text-slate-500">跳过</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
              <p className="text-sm text-slate-500">待执行</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索用例..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>全部状态</option>
                <option>待执行</option>
                <option>执行中</option>
                <option>通过</option>
                <option>失败</option>
                <option>跳过</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredCases.map((tc) => (
            <div key={tc.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-3 h-3 rounded-full ${
                    tc.status === 'pass' ? 'bg-green-500' :
                    tc.status === 'fail' ? 'bg-red-500' :
                    tc.status === 'skip' ? 'bg-yellow-500' :
                    tc.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    'bg-slate-300'
                  }`}></div>
                  <div>
                    <p className="font-medium text-slate-800">{tc.name}</p>
                    <p className="text-sm text-slate-500">{tc.requirement} - {tc.module}</p>
                  </div>
                </div>

                {tc.status === 'running' ? (
                  <div className="flex items-center gap-4">
                    <div className="w-48">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${tc.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{tc.progress}%</p>
                    </div>
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {tc.status === 'pending' && (
                      <>
                        <button
                          onClick={() => runSingleCase(tc.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="执行"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => skipCase(tc.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="跳过"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {(tc.status === 'pass' || tc.status === 'fail' || tc.status === 'skip') && (
                      <button
                        onClick={() => resetCase(tc.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="重置"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
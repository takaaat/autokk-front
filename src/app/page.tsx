'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from "next/image";

interface ApiStatus {
  status: 'started' | 'processing' | 'completed' | 'failed' | 'request';
}

export default function Home() {
  const [status, setStatus] = useState<ApiStatus>({status: 'started' });
  const [isPolling, setIsPolling] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const fetchStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/task-status/${id}`);
      const data: ApiStatus = await response.json();
      return data;
    } catch (error) {
      console.error('Status fetch error:', error);
      const e: ApiStatus = {status: 'failed'};
      return e;
    }
  }, []);

  const startAsyncTask = async () => {
    try {
      setStatus({ status: 'started' });
      
      const response = await fetch('http://127.0.0.1:8000/start-task/', {
        method: 'POST',
      });
      
      const { task_id: newTaskId } = await response.json();
      setTaskId(newTaskId);
      console.log(newTaskId);
      setIsPolling(true);
      setStatus({ status: 'started' });
    } catch (error) {
      console.error('Task start error:', error);
      setStatus({ status: 'failed'});
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && taskId) {
      intervalId = setInterval(async () => {
        const newStatus = await fetchStatus(taskId);
        setStatus(newStatus);

        if (newStatus.status === 'completed' || newStatus.status === 'failed') {
          setIsPolling(false);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, taskId, fetchStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return 'text-gray-500';
      case 'processing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'request': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'started': return '待機中';
      case 'processing': return '処理中...';
      case 'completed': return '完了';
      case 'failed': return 'エラー';
      case 'request': return '追加認証の要求';
      default: return '不明';
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        非同期処理
      </h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">ステータス:</span>
            <span className={`font-bold ${getStatusColor(status.status)}`}>
              {getStatusText(status.status)}
            </span>
          </div>
          
          
          
          {taskId && (
            <p className="text-xs text-gray-400 mt-2">
              Task ID: {taskId}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={startAsyncTask}
            disabled={isPolling}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
              isPolling
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } transition-colors`}
          >
            {isPolling ? '処理中...' : 'タスク開始'}
          </button>
          
          <button
            onClick={() => {
              setIsPolling(false);
              setStatus({ status: 'started' });
              setTaskId(null);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            リセット
          </button>
        </div>

        {isPolling && (
          <div className="flex items-center justify-center text-sm text-blue-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2" />
            5秒ごとに状態を確認中...
          </div>
        )}

      {status.status === "request" && (
        <div>
        <div className="p-2 bg-yellow-100 text-yellow-800 rounded">
          追加の認証が要求されています．
        </div>
      <div className="mt-4 flex justify-center">
        <Image
          src={`http://127.0.0.1:8000/image/${taskId}.png`}
          alt="表示画像"
          className="max-w-xs rounded shadow"
        width={300}
        height={300}

        />
      </div>

        </div>

      )}
      </div>
    </div>
  );
}
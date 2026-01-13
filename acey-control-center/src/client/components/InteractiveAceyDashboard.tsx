// File: src/client/components/InteractiveAceyDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Play, Pause, Edit, Save, X, Eye, Download, RefreshCw, Volume2, Code, Image } from 'lucide-react';

// Mock Monaco Editor component (in production, this would be the actual Monaco Editor)
const MonacoEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
}> = ({ value, onChange, language = 'typescript', height = '400px', readOnly = false }) => (
  <div className="border rounded-lg p-4 bg-gray-50" style={{ height }}>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-600">Monaco Editor ({language})</span>
      <Badge variant="outline">{readOnly ? 'Read-only' : 'Editable'}</Badge>
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full p-2 font-mono text-sm bg-white border rounded resize-none"
      style={{ minHeight: '300px' }}
      readOnly={readOnly}
      placeholder={`// ${language} code will appear here...`}
    />
  </div>
);

// Mock HTML5 Audio Player
const AudioPlayer: React.FC<{ src?: string; title?: string }> = ({ src, title }) => (
  <div className="space-y-3">
    {title && <h4 className="font-medium">{title}</h4>}
    {src ? (
      <audio controls className="w-full">
        <source src={src} type="audio/mpeg" />
        <source src={src} type="audio/wav" />
        <source src={src} type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
    ) : (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Volume2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">No audio file available</p>
        <p className="text-sm text-gray-400">Generated audio will appear here</p>
      </div>
    )}
  </div>
);

// Mock Image Preview
const ImagePreview: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => (
  <div className="space-y-3">
    {src ? (
      <img 
        src={src} 
        alt={alt || 'Generated image'} 
        className="max-w-full h-auto rounded-lg border"
        style={{ maxHeight: '400px' }}
      />
    ) : (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Image className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">No image available</p>
        <p className="text-sm text-gray-400">Generated images will appear here</p>
      </div>
    )}
  </div>
);

interface TaskPreview {
  id: string;
  taskType: string;
  prompt: string;
  context: any;
  output: {
    speech: string;
    audioFilePath?: string;
    imageUrl?: string;
    intents: Array<{ type: string; confidence?: number }>;
    confidence?: number;
    trust?: number;
  };
  processed: boolean;
  timestamp: string;
  fineTuneJobId?: string;
  learningUpdate: boolean;
  metadata: any;
}

interface InteractiveAceyDashboardProps {
  tasks: TaskPreview[];
  onEditTask?: (taskId: string, updatedTask: Partial<TaskPreview>) => void;
  onDeleteTask?: (taskId: string) => void;
  onApproveTask?: (taskId: string) => void;
  onRejectTask?: (taskId: string) => void;
  onDownloadTask?: (taskId: string) => void;
}

export const InteractiveAceyDashboard: React.FC<InteractiveAceyDashboardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onApproveTask,
  onRejectTask,
  onDownloadTask
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskPreview | null>(null);
  const [editingTask, setEditingTask] = useState<TaskPreview | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [isPlaying, setIsPlaying] = useState(false);

  // Select a task for detailed preview
  const selectTask = useCallback((task: TaskPreview) => {
    setSelectedTask(task);
    setEditingTask(null);
    setActiveTab('preview');
  }, []);

  // Start editing a task
  const startEditing = useCallback((task: TaskPreview) => {
    setEditingTask({ ...task });
    setActiveTab('edit');
  }, []);

  // Save edited task
  const saveEdit = useCallback(() => {
    if (editingTask && onEditTask) {
      onEditTask(editingTask.id, editingTask);
      setSelectedTask(editingTask);
      setEditingTask(null);
      setActiveTab('preview');
    }
  }, [editingTask, onEditTask]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingTask(null);
    if (selectedTask) {
      setActiveTab('preview');
    }
  }, [selectedTask]);

  // Extract code from speech (for code tasks)
  const extractCode = (speech: string): string => {
    const codeMatch = speech.match(/```[\w]*\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : speech;
  };

  // Get language from context (for code tasks)
  const getLanguage = (context: any): string => {
    return context?.language || 'typescript';
  };

  // Render task list
  const renderTaskList = () => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedTask?.id === task.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => selectTask(task)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={task.taskType === 'audio' ? 'default' : 'secondary'}>
                {task.taskType}
              </Badge>
              <Badge variant={task.processed ? 'default' : 'destructive'}>
                {task.processed ? 'Processed' : 'Failed'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(task.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="text-sm font-medium mb-1">{task.prompt}</div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confidence: {Math.round((task.output.confidence || 0) * 100)}%</span>
            <span>Trust: {Math.round((task.output.trust || 0) * 100)}%</span>
          </div>
          
          {task.fineTuneJobId && (
            <div className="mt-2 flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                Fine-tune: {task.fineTuneJobId.substring(0, 8)}...
              </Badge>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Render task preview
  const renderTaskPreview = () => {
    if (!selectedTask) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a task to preview details</p>
        </div>
      );
    }

    const task = selectedTask;

    return (
      <div className="space-y-6">
        {/* Task Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{task.prompt}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{task.taskType}</Badge>
              <Badge variant={task.processed ? 'default' : 'destructive'}>
                {task.processed ? 'Processed' : 'Failed'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(task.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => startEditing(task)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            {onDownloadTask && (
              <Button variant="outline" size="sm" onClick={() => onDownloadTask(task.id)}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
            {onDeleteTask && (
              <Button variant="outline" size="sm" onClick={() => onDeleteTask(task.id)}>
                <X className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Task Content Based on Type */}
        {task.taskType === 'audio' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Audio Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AudioPlayer src={task.output.audioFilePath} title="Generated Audio" />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Script:</h4>
                <p className="text-sm text-gray-700">{task.output.speech}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {task.taskType === 'coding' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Code Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonacoEditor
                value={extractCode(task.output.speech)}
                onChange={() => {}}
                language={getLanguage(task.context)}
                height="400px"
                readOnly={true}
              />
            </CardContent>
          </Card>
        )}

        {task.taskType === 'images' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Image Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePreview src={task.output.imageUrl} alt={task.prompt} />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Description:</h4>
                <p className="text-sm text-gray-700">{task.output.speech}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Intents and Auto-Rule Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Intents & Auto-Rule Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Detected Intents:</h4>
                <div className="space-y-1">
                  {task.output.intents.map((intent, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{intent.type}</span>
                      <Badge variant="outline">
                        {Math.round((intent.confidence || 0) * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Confidence Score:</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(task.output.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round((task.output.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Trust Score:</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(task.output.trust || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round((task.output.trust || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Information */}
        {task.fineTuneJobId && (
          <Card>
            <CardHeader>
              <CardTitle>Learning Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Fine-Tune Job ID:</span>
                  <Badge variant="outline">{task.fineTuneJobId}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Learning Update:</span>
                  <Badge variant={task.learningUpdate ? 'default' : 'secondary'}>
                    {task.learningUpdate ? 'Applied' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render task editor
  const renderTaskEditor = () => {
    if (!editingTask) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <Edit className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a task and click Edit to modify</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Task</h3>
          <div className="flex items-center gap-2">
            <Button onClick={saveEdit}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea
              value={editingTask.prompt}
              onChange={(e) => setEditingTask({ ...editingTask, prompt: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Output</label>
            <MonacoEditor
              value={editingTask.output.speech}
              onChange={(value) => setEditingTask({
                ...editingTask,
                output: { ...editingTask.output, speech: value }
              })}
              language={editingTask.taskType === 'coding' ? getLanguage(editingTask.context) : 'plaintext'}
              height="300px"
              readOnly={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Confidence</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={editingTask.output.confidence || 0}
                onChange={(e) => setEditingTask({
                  ...editingTask,
                  output: { ...editingTask.output, confidence: parseFloat(e.target.value) }
                })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trust</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={editingTask.output.trust || 0}
                onChange={(e) => setEditingTask({
                  ...editingTask,
                  output: { ...editingTask.output, trust: parseFloat(e.target.value) }
                })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Interactive Task Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tasks.length} Tasks</Badge>
          <Badge variant="outline">
            {tasks.filter(t => t.processed).length} Processed
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Task List</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTaskList()}
            </CardContent>
          </Card>
        </div>

        {/* Task Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="preview">
                  {renderTaskPreview()}
                </TabsContent>
                <TabsContent value="edit">
                  {renderTaskEditor()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  Button,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type OverlayTestingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OverlayTesting'>;

interface TestResult {
  testName: string;
  status: 'pending' | 'passing' | 'failing';
  error?: string;
  fix?: string;
}

interface OverlayAnalysis {
  elements: string[];
  testCoverage: number;
  recommendations: string[];
}

export default function OverlayTestingScreen() {
  const navigation = useNavigation<OverlayTestingNavigationProp>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState('http://localhost:8080/overlay');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [analysis, setAnalysis] = useState<OverlayAnalysis | null>(null);

  const analyzeOverlay = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate API call to analyze overlay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis: OverlayAnalysis = {
        elements: [
          '.overlay-container',
          '.chat-overlay', 
          '.brand-logo',
          '.stats-overlay',
          '.community-cards',
          '.settings-button'
        ],
        testCoverage: 75,
        recommendations: [
          'Add tests for error states',
          'Include responsive design tests',
          'Add performance benchmarks'
        ]
      };
      
      setAnalysis(mockAnalysis);
      Alert.alert('Analysis Complete', `Found ${mockAnalysis.elements.length} testable elements`);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Could not analyze overlay. Please check the URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateTests = async () => {
    setIsGeneratingTests(true);
    try {
      // Simulate test generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockTestResults: TestResult[] = [
        { testName: 'should load overlay page correctly', status: 'passing' },
        { testName: 'should display chat overlay', status: 'passing' },
        { testName: 'should handle settings panel', status: 'failing', 
          error: 'Element .settings-button not found',
          fix: 'Update selector to #settings-button' },
        { testName: 'should display community cards', status: 'passing' },
        { testName: 'should handle chat messages', status: 'pending' }
      ];
      
      setTestResults(mockTestResults);
      Alert.alert('Tests Generated', `${mockTestResults.length} tests created with ${mockTestResults.filter(t => t.status === 'passing').length} passing`);
    } catch (error) {
      Alert.alert('Generation Failed', 'Could not generate tests. Please try again.');
    } finally {
      setIsGeneratingTests(false);
    }
  };

  const runTests = async () => {
    // Update test results to simulate running tests
    const updatedResults = testResults.map(test => ({
      ...test,
      status: Math.random() > 0.3 ? 'passing' : 'failing' as 'passing' | 'failing'
    }));
    setTestResults(updatedResults);
    
    const passingCount = updatedResults.filter(t => t.status === 'passing').length;
    Alert.alert('Tests Complete', `${passingCount}/${updatedResults.length} tests passed`);
  };

  const applyFix = (testIndex: number) => {
    const updatedResults = [...testResults];
    updatedResults[testIndex] = {
      ...updatedResults[testIndex],
      status: 'passing',
      error: undefined,
      fix: undefined
    };
    setTestResults(updatedResults);
    Alert.alert('Fix Applied', 'Test fix has been applied successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passing': return '#4CAF50';
      case 'failing': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Overlay Testing Pro</Text>
        <Text style={styles.subtitle}>AI-Powered Playwright Test Assistant</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <TextInput
          style={styles.input}
          value={overlayUrl}
          onChangeText={setOverlayUrl}
          placeholder="Overlay URL"
          autoCapitalize="none"
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.analyzeButton]} 
            onPress={analyzeOverlay}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Analyze Overlay</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.generateButton]} 
            onPress={generateTests}
            disabled={isGeneratingTests}
          >
            {isGeneratingTests ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Generate Tests</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {analysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Results</Text>
          <View style={styles.analysisCard}>
            <Text style={styles.analysisText}>📊 Test Coverage: {analysis.testCoverage}%</Text>
            <Text style={styles.analysisText}>🔍 Elements Found: {analysis.elements.length}</Text>
            <Text style={styles.analysisText}>💡 Recommendations: {analysis.recommendations.length}</Text>
          </View>
          
          <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          {analysis.recommendations.map((rec, index) => (
            <Text key={index} style={styles.recommendation}>• {rec}</Text>
          ))}
        </View>
      )}

      {testResults.length > 0 && (
        <View style={styles.section}>
          <View style={styles.testHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <TouchableOpacity style={styles.runButton} onPress={runTests}>
              <Text style={styles.runButtonText}>Run Tests</Text>
            </TouchableOpacity>
          </View>
          
          {testResults.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testRow}>
                <Text style={styles.testName}>{test.testName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) }]}>
                  <Text style={styles.statusText}>{test.status.toUpperCase()}</Text>
                </View>
              </View>
              
              {test.error && (
                <Text style={styles.errorText}>❌ {test.error}</Text>
              )}
              
              {test.fix && (
                <View style={styles.fixSection}>
                  <Text style={styles.fixText}>💡 Suggested Fix: {test.fix}</Text>
                  <TouchableOpacity 
                    style={styles.applyFixButton} 
                    onPress={() => applyFix(index)}
                  >
                    <Text style={styles.applyFixText}>Apply Fix</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acey Features</Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>✨ Automatic test generation</Text>
          <Text style={styles.feature}>🔧 Smart failure analysis</Text>
          <Text style={styles.feature}>📊 Coverage reporting</Text>
          <Text style={styles.feature}>🚀 One-click fix application</Text>
          <Text style={styles.feature}>📱 Mobile test management</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
  },
  generateButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  analysisCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  analysisText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  recommendation: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    paddingLeft: 10,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  runButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  runButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  testCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 8,
  },
  fixSection: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 6,
  },
  fixText: {
    color: '#1976D2',
    fontSize: 14,
    marginBottom: 8,
  },
  applyFixButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  applyFixText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureList: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
});

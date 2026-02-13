import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { colors, SIZES } from '@/styles/styles';

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'twigs_todos';

export default function ForYouTab() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load todos from storage on mount
  useEffect(() => {
    loadTodos();
  }, []);

  // Save todos to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveTodos();
    }
  }, [todos, isLoading]);

  const loadTodos = async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        setTodos(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading todos:', error);
      Alert.alert('Error', 'Failed to load your to-do list');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTodos = async () => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.error('Error saving todos:', error);
      Alert.alert('Error', 'Failed to save your to-do list');
    }
  };

  const addTodo = () => {
    const trimmedText = inputText.trim();
    if (!trimmedText) {
      return;
    }

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: trimmedText,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos([newTodo, ...todos]);
    setInputText('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTodos(todos.filter(todo => todo.id !== id));
          },
        },
      ]
    );
  };

  const clearCompleted = () => {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount === 0) {
      Alert.alert('No Completed Tasks', 'You have no completed tasks to clear');
      return;
    }

    Alert.alert(
      'Clear Completed',
      `Delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setTodos(todos.filter(todo => !todo.completed));
          },
        },
      ]
    );
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My To-Do List</Text>
            <Text style={styles.subtitle}>Stay organized and productive</Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputCard}>
          <View style={styles.inputSection}>
            <View style={styles.inputWrapper}>
              <Ionicons name="create-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="What needs to be done?"
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={addTodo}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity
              style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
              onPress={addTodo}
              disabled={!inputText.trim()}
            >
              <Ionicons name="add" size={26} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        {todos.length > 0 && (
          <View style={styles.stats}>
            <View style={[styles.statItem, styles.statItemActive]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.statNumber}>{activeTodos.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={[styles.statItem, styles.statItemCompleted]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
              </View>
              <View>
                <Text style={styles.statNumber}>{completedTodos.length}</Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="list-outline" size={20} color={colors.purple} />
              </View>
              <View>
                <Text style={styles.statNumber}>{todos.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {todos.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>No tasks yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first task above to start organizing{'\n'}your day and stay productive!
            </Text>
          </View>
        )}

        {/* Active Todos */}
        {activeTodos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Tasks</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{activeTodos.length}</Text>
              </View>
            </View>
            {activeTodos.map(todo => (
              <TodoItemComponent
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
          </View>
        )}

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderCompleted}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>Completed</Text>
                <View style={[styles.sectionBadge, styles.sectionBadgeCompleted]}>
                  <Text style={styles.sectionBadgeText}>{completedTodos.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={clearCompleted} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {completedTodos.map(todo => (
              <TodoItemComponent
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TodoItemComponent({
  todo,
  onToggle,
  onDelete,
}: {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={[styles.todoItem, todo.completed && styles.todoItemCompleted]}>
      <TouchableOpacity
        style={styles.todoLeft}
        onPress={() => onToggle(todo.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, todo.completed && styles.checkboxCompleted]}>
          {todo.completed && (
            <Ionicons name="checkmark" size={20} color={colors.white} />
          )}
        </View>
        <View style={styles.todoTextContainer}>
          <Text style={[styles.todoText, todo.completed && styles.todoTextCompleted]}>
            {todo.text}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(todo.id)}
      >
        <Ionicons name="trash-outline" size={22} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.font.md,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.spacing.xl,
    paddingBottom: 100,
  },
  header: {
    marginBottom: SIZES.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: SIZES.font.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inputSection: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: SIZES.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: SIZES.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    fontSize: SIZES.font.md,
    color: colors.text,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: colors.lightGrey,
    shadowOpacity: 0.1,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
    paddingLeft: SIZES.spacing.md,
  },
  statItemActive: {
    paddingRight: SIZES.spacing.md,
    paddingLeft: 0,
  },
  statItemCompleted: {
    paddingHorizontal: SIZES.spacing.md,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.divider,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: SIZES.spacing.xxl * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: SIZES.spacing.md,
  },
  emptyStateText: {
    fontSize: SIZES.font.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: SIZES.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
    paddingLeft: SIZES.spacing.xs,
    gap: SIZES.spacing.sm,
  },
  sectionHeaderCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.lg,
    paddingLeft: SIZES.spacing.xs,
    paddingRight: SIZES.spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sectionBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  sectionBadgeCompleted: {
    backgroundColor: '#dcfce7',
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: SIZES.spacing.lg,
    paddingRight: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  todoItemCompleted: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  todoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
    paddingRight: SIZES.spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
  },
  todoTextContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: SIZES.font.md,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 22,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
    fontWeight: '400',
  },
  deleteButton: {
    padding: SIZES.spacing.sm,
    marginLeft: SIZES.spacing.xs,
  },
});

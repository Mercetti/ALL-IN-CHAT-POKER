# 🔐 Access Control System for Acey Mobile Control Center

## 📋 Access Control Overview

The system implements **role-based access control** where:
- **Owner (mercetti)**: Complete access to all features, resources, and admin functions
- **Regular Users**: Limited access based on subscription tiers and feature permissions

## 🏗️ Access Control Architecture

### Role-Based Access Matrix

| Feature | Owner (mercetti) | Regular Users |
|----------|-------------------|---------------|
| **Admin Panel** | ✅ Full Access | ❌ Blocked |
| **User Management** | ✅ Full Access | ❌ Blocked |
| **Skill Store** | ✅ Full Access | ✅ Tier-Limited |
| **All Skills** | ✅ Unlimited | ✅ Tier-Limited |
| **Memory Dashboard** | ✅ Full Access | ✅ Own Data Only |
| **Usage Analytics** | ✅ Full Access | ✅ Own Data Only |
| **System Settings** | ✅ Full Access | ❌ Blocked |
| **API Access** | ✅ Full Access | ❌ Blocked |
| **Export Data** | ✅ Full Access | ✅ Own Data Only |

### 🔑 Authentication & Authorization

```typescript
// /types/access.ts
export type UserRole = 'owner' | 'regular';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  tier: 'Free' | 'Pro' | 'Enterprise';
  permissions: UserPermissions;
  createdAt: Date;
  lastLogin: Date;
}

export interface UserPermissions {
  // Skill permissions
  canUseCodeHelper: boolean;
  canUseGraphicsWizard: boolean;
  canUseAudioMaestro: boolean;
  canUseStreamAnalyticsPro: boolean;
  canUseAICoHostGames: boolean;
  canUseCustomMiniAceyPersona: boolean;
  canUseDonationIncentiveManager: boolean;
  canUseDynamicAlertDesigner: boolean;
  canUseExternalLinkReview: boolean;
  
  // Feature permissions
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canViewSystemSettings: boolean;
  canAccessAPI: boolean;
  canExportData: boolean;
  
  // Data permissions
  canViewAllUserData: boolean;
  canViewSystemAnalytics: boolean;
  canAccessMemoryDashboard: boolean;
}
```

## 🛡️ Implementation Strategy

### 1. Route Guards
```typescript
// /hooks/useAccessControl.ts
import { useUser } from '../contexts/UserContext';
import { UserRole } from '../types/access';

export const useAccessControl = () => {
  const { user } = useUser();
  
  const isOwner = user?.role === 'owner';
  const isRegular = user?.role === 'regular';
  
  return {
    isOwner,
    isRegular,
    canAccessAdminPanel: isOwner,
    canManageUsers: isOwner,
    canViewSystemSettings: isOwner,
    canAccessAPI: isOwner,
    canExportData: isOwner,
    canAccessAllSkills: isOwner,
    canUseSkill: (skill: SkillType) => {
      if (isOwner) return true;
      return user?.permissions[`canUse${skill}`] || false;
    },
    canAccessMemoryDashboard: true, // All users can access their own data
    canViewSystemAnalytics: isOwner, // Only owner can view system-wide analytics
  };
};
```

### 2. Protected Components
```typescript
// /components/ProtectedComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAccessControl } from '../hooks/useAccessControl';

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export const ProtectedComponent: React.FC<Props> = ({ 
  children, 
  requiredRole = 'owner', 
  fallback = null 
}) => {
  const { isOwner } = useAccessControl();
  
  if (requiredRole === 'owner' && !isOwner) {
    return fallback || (
      <View style={styles.blockedContainer}>
        <Text style={styles.blockedText}>🔒 Owner Access Required</Text>
        <Text style={styles.blockedSubtext}>This feature is only available to the account owner</Text>
      </View>
    );
  }
  
  return <>{children}</>;
};

const styles = StyleSheet.create({
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  blockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 8,
  },
  blockedSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});
```

### 3. Admin Panel with User Management
```typescript
// /screens/AdminPanel.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useAccessControl } from '../hooks/useAccessControl';
import { User, UserRole } from '../types/access';

export const AdminPanel: React.FC = () => {
  const { isOwner } = useAccessControl();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!isOwner) {
    return (
      <View style={styles.blockedContainer}>
        <Text style={styles.blockedText}>🔒 Access Denied</Text>
        <Text style={styles.blockedSubtext}>Admin panel is only accessible to the account owner</Text>
      </View>
    );
  }

  const handleCreateUser = async (email: string, role: UserRole) => {
    // API call to create user
    console.log(`[Admin] Creating user: ${email} with role: ${role}`);
    // In production, this would call your user management API
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    // API call to update user role
    console.log(`[Admin] Updating user ${userId} to role: ${newRole}`);
    Alert.alert(
      'Role Updated',
      `User role has been updated to ${newRole}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            console.log(`[Admin] Deleting user: ${userId}`);
            // API call to delete user
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
        <Text style={styles.userTier}>{item.tier}</Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.updateButton]}
          onPress={() => handleUpdateUserRole(item.id, item.role === 'owner' ? 'regular' : 'owner')}
        >
          <Text style={styles.actionButtonText}>
            {item.role === 'owner' ? 'Demote to Regular' : 'Promote to Owner'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => handleCreateUser('newuser@example.com', 'regular')}
        >
          <Text style={styles.createButtonText}>+ Add Regular User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.createButton, styles.ownerButton]}
          onPress={() => handleCreateUser('newowner@example.com', 'owner')}
        >
          <Text style={styles.createButtonText}>+ Add Owner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  userTier: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  updateButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ownerButton: {
    backgroundColor: '#9C27B0',
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  blockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 8,
  },
  blockedSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
```

### 4. Tier-Based Skill Access Control
```typescript
// Updated skill usage check with user permissions
export const canUseSkill = (skill: SkillType, user: User): boolean => {
  // Owner can use all skills
  if (user.role === 'owner') return true;
  
  // Regular users are limited by tier and permissions
  const tierPermissions = getTierPermissions(user.tier);
  const hasSkillPermission = user.permissions[`canUse${skill}`] || false;
  
  return tierPermissions.skills.includes(skill) && hasSkillPermission;
};

const getTierPermissions = (tier: 'Free' | 'Pro' | 'Enterprise') => {
  const permissions = {
    Free: {
      skills: ['CodeHelper', 'GraphicsWizard', 'AudioMaestro', 'ExternalLinkReview'],
      maxOutputsPerDay: 10,
      maxMemoryOutputs: 5,
    },
    Pro: {
      skills: ['CodeHelper', 'GraphicsWizard', 'AudioMaestro', 'ExternalLinkReview', 'StreamAnalyticsPro', 'DynamicAlertDesigner'],
      maxOutputsPerDay: 50,
      maxMemoryOutputs: 25,
    },
    Enterprise: {
      skills: ['CodeHelper', 'GraphicsWizard', 'AudioMaestro', 'ExternalLinkReview', 'StreamAnalyticsPro', 'DynamicAlertDesigner', 'AICoHostGames', 'CustomMiniAceyPersona', 'DonationIncentiveManager'],
      maxOutputsPerDay: 200,
      maxMemoryOutputs: 100,
    },
  };
  
  return permissions[tier];
};
```

### 5. Data Access Control
```typescript
// Memory access control - users can only see their own data
export const canAccessMemoryData = (requestedUserId: string, currentUserId: string): boolean => {
  return requestedUserId === currentUserId;
};

// System analytics - only owner can view
export const canViewSystemAnalytics = (user: User): boolean => {
  return user.role === 'owner';
};

// Export functionality - only owner can export system data
export const canExportSystemData = (user: User): boolean => {
  return user.role === 'owner';
};
```

## 🔐 Security Considerations

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Role Verification**: Server-side role validation on each request
- **Session Management**: Automatic timeout and refresh

### API Security
- **Rate Limiting**: Different limits per user role
- **Input Validation**: Sanitize all user inputs
- **CORS**: Proper cross-origin configuration

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: All access attempts logged
- **Data Isolation**: User data properly segregated

## 📱 Mobile Implementation Notes

### Navigation Guards
```typescript
// App.tsx navigation protection
const App = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      {user?.role === 'owner' ? (
        <Tab.Navigator>
          <Tab.Screen name="Chat" component={ChatScreen} />
          <Tab.Screen name="Skills" component={SkillStoreScreen} />
          <Tab.Screen name="Admin" component={AdminPanel} />
          <Tab.Screen name="Memory" component={MemoryDashboard} />
        </Tab.Navigator>
      ) : (
        <Tab.Navigator>
          <Tab.Screen name="Chat" component={ChatScreen} />
          <Tab.Screen name="Skills" component={SkillStoreScreen} />
          <Tab.Screen name="Memory" component={MemoryDashboard} />
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
};
```

### Component-Level Protection
```typescript
// Skill store with tier enforcement
const SkillStoreScreen = () => {
  const { user, canUseSkill } = useAccessControl();
  
  const filteredSkills = ALL_SKILLS.filter(skill => 
    canUseSkill(skill, user)
  );

  return (
    <View>
      {filteredSkills.map(skill => (
        <SkillCard 
          key={skill}
          skill={skill}
          isLocked={!canUseSkill(skill, user)}
          onUpgrade={() => user.tier !== 'Enterprise' && showUpgradeModal(skill)}
        />
      ))}
    </View>
  );
};
```

## 🚀 Implementation Benefits

### For Owner (mercetti)
- ✅ **Complete Control**: Full access to all features and settings
- ✅ **User Management**: Create, modify, and delete user accounts
- ✅ **System Analytics**: View system-wide usage and performance metrics
- ✅ **Admin Functions**: System configuration and maintenance
- ✅ **Data Export**: Export any system data for backup

### For Regular Users
- ✅ **Tier-Based Access**: Skills available based on subscription level
- ✅ **Usage Limits**: Fair usage limits to prevent abuse
- ✅ **Personal Data**: Full access to their own outputs and learning data
- ✅ **Secure Experience**: Protected from system-level functions
- ✅ **Upgrade Path**: Clear upgrade prompts when accessing premium features

### Security Benefits
- ✅ **Role Isolation**: Clear separation between owner and regular user permissions
- ✅ **Access Logging**: Complete audit trail of all access attempts
- ✅ **Data Protection**: User data properly segregated and protected
- ✅ **Scalable**: Easy to add new roles and permissions as system grows

This access control system ensures that **mercetti** has complete administrative control while **regular users** have appropriate access to features based on their subscription tier, maintaining security and fair usage policies.

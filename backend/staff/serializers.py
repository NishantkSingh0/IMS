from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Permission, RolePermission, ActivityLog

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'address', 'avatar', 'is_active',
            'salary', 'hire_date', 'date_joined', 'last_login', 'password'
        ]
        read_only_fields = ['date_joined', 'last_login']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user lists."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active', 'avatar']


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission model."""
    
    class Meta:
        model = Permission
        fields = '__all__'


class RolePermissionSerializer(serializers.ModelSerializer):
    """Serializer for RolePermission model."""
    
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'permission', 'permission_name']


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_name', 'user_email', 'action',
            'model_name', 'object_id', 'description', 'ip_address',
            'user_agent', 'timestamp'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer for login with additional user info."""
    
    email = serializers.EmailField()
    password = serializers.CharField()

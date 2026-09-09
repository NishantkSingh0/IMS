from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import Permission, RolePermission, ActivityLog

User = get_user_model()


class CustomTokenObtainPairSerializer(serializers.Serializer):
    """Custom JWT serializer that uses email instead of username with enhanced security."""
    
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.contrib.auth import authenticate
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        email = attrs.get('email')
        password = attrs.get('password')
        
        # Validate input presence
        if not email:
            raise serializers.ValidationError({'email': 'Email is required.'})
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})
        
        # Check if user exists first (prevents timing attacks)
        try:
            user = User.objects.get(email__iexact=email)  # Case-insensitive email lookup
        except User.DoesNotExist:
            # Don't reveal whether user exists for security
            raise serializers.ValidationError({
                'detail': 'Invalid email or password.'
            })
        
        # Check if user is active before attempting authentication
        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'This account has been disabled. Please contact administrator.'
            })
        
        # Attempt authentication
        authenticated_user = authenticate(username=email, password=password)
        
        if not authenticated_user:
            # Log failed attempt for security monitoring
            raise serializers.ValidationError({
                'detail': 'Invalid email or password.'
            })
        
        # Additional security check
        if authenticated_user != user:
            raise serializers.ValidationError({
                'detail': 'Authentication failed due to security verification.'
            })
        
        # Generate JWT tokens
        try:
            refresh = RefreshToken.for_user(authenticated_user)
            
            # Add custom claims to the token
            refresh['email'] = authenticated_user.email
            refresh['role'] = authenticated_user.role
            refresh['full_name'] = authenticated_user.get_full_name()
            
            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': authenticated_user.id,
                    'email': authenticated_user.email,
                    'full_name': authenticated_user.get_full_name(),
                    'role': authenticated_user.role,
                }
            }
        except Exception as e:
            raise serializers.ValidationError({
                'detail': 'Failed to generate authentication tokens. Please try again.'
            })


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

    def validate_email(self, value):
        if not value or '@' not in value:
            raise serializers.ValidationError("Invalid email format")
        return value.lower()

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("First name is required")
        if len(value) > 100:
            raise serializers.ValidationError("First name cannot exceed 100 characters")
        return value.strip()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Last name is required")
        if len(value) > 100:
            raise serializers.ValidationError("Last name cannot exceed 100 characters")
        return value.strip()

    def validate_phone(self, value):
        if value and len(value) > 15:
            raise serializers.ValidationError("Phone number cannot exceed 15 characters")
        return value

    def validate_salary(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Salary cannot be negative")
        if value is not None and value > 10000000:
            raise serializers.ValidationError("Salary is too high")
        return value

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")
        return value

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

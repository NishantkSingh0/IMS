from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for the User model."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'owner')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model for the BMS system."""
    
    ROLE_CHOICES = [
        ('owner', 'Business Owner'),
        ('manager', 'Store Manager'),
        ('cashier', 'Cashier'),
        ('worker', 'Worker'),
    ]
    
    username = None  # Remove username field
    email = models.EmailField('Email Address', unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='worker')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # Salary and employment details
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hire_date = models.DateField(blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    @property
    def is_owner(self):
        return self.role == 'owner'
    
    @property
    def is_manager(self):
        return self.role in ['owner', 'manager']


class Permission(models.Model):
    """Custom permissions for fine-grained access control."""
    
    name = models.CharField(max_length=100)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
    
    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Maps roles to permissions."""
    
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['role', 'permission']
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'


class ActivityLog(models.Model):
    """Logs user activities for audit trail."""
    
    ACTION_CHOICES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('create', 'Create Record'),
        ('update', 'Update Record'),
        ('delete', 'Delete Record'),
        ('view', 'View Record'),
        ('export', 'Export Data'),
        ('sale', 'Process Sale'),
        ('refund', 'Process Refund'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.IntegerField(blank=True, null=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.timestamp}"

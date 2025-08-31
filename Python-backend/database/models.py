from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default='student')
    institution = Column(String(255))
    bio = Column(Text)
    avatar = Column(String(255))
    preferences = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    learning_sessions = relationship("LearningSession", back_populates="user")
    wellness_entries = relationship("WellnessEntry", back_populates="user")
    
    # Indexes
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_role', 'role'),
        Index('idx_user_last_login', 'last_login'),
    )

class LearningModule(Base):
    __tablename__ = 'learning_modules'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)
    difficulty = Column(String(50), default='intermediate')
    duration = Column(Integer)  # in minutes
    topics = Column(JSON, default=[])
    prerequisites = Column(JSON, default=[])
    content_data = Column(JSON, default={})
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    learning_sessions = relationship("LearningSession", back_populates="module")
    
    # Indexes
    __table_args__ = (
        Index('idx_module_category', 'category'),
        Index('idx_module_difficulty', 'difficulty'),
        Index('idx_module_active', 'active'),
    )

class LearningSession(Base):
    __tablename__ = 'learning_sessions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey('learning_modules.id'), nullable=False)
    session_type = Column(String(50), default='study')
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    duration = Column(Float)  # in minutes
    status = Column(String(50), default='active')
    
    # Cognitive metrics
    initial_cognitive_state = Column(JSON, default={})
    current_cognitive_state = Column(JSON, default={})
    final_cognitive_state = Column(JSON, default={})
    
    # Performance metrics
    attention_score = Column(Float)
    engagement_score = Column(Float)
    confusion_level = Column(Float)
    fatigue_level = Column(Float)
    wellness_score = Column(Float)
    
    # Learning metrics
    content_progress = Column(Float, default=0)
    completion_percentage = Column(Float, default=0)
    interactions = Column(JSON, default=[])
    adaptations_applied = Column(JSON, default={})
    
    # Feedback
    session_feedback = Column(JSON, default={})
    
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="learning_sessions")
    module = relationship("LearningModule", back_populates="learning_sessions")
    
    # Indexes
    __table_args__ = (
        Index('idx_session_user_id', 'user_id'),
        Index('idx_session_module_id', 'module_id'),
        Index('idx_session_started_at', 'started_at'),
        Index('idx_session_status', 'status'),
    )

class WellnessEntry(Base):
    __tablename__ = 'wellness_entries'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Wellness metrics
    mood_score = Column(Integer)  # 1-10 scale
    stress_level = Column(Integer)  # 1-10 scale
    energy_level = Column(Integer)  # 1-10 scale
    sleep_hours = Column(Float)
    sleep_quality = Column(Integer)  # 1-10 scale
    
    # Additional data
    notes = Column(Text)
    mood_tags = Column(JSON, default=[])
    activities = Column(JSON, default=[])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="wellness_entries")
    
    # Indexes
    __table_args__ = (
        Index('idx_wellness_user_id', 'user_id'),
        Index('idx_wellness_created_at', 'created_at'),
    )

class EmotionAnalysis(Base):
    __tablename__ = 'emotion_analyses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey('learning_sessions.id'))
    
    # Emotion data
    primary_emotion = Column(String(50))
    emotion_confidence = Column(Float)
    emotion_probabilities = Column(JSON, default={})
    emotion_intensity = Column(Float)
    
    # Face detection data
    face_detected = Column(Boolean, default=False)
    face_coordinates = Column(JSON, default={})
    
    # Processing metadata
    processing_time = Column(Float)  # in milliseconds
    model_version = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_emotion_user_id', 'user_id'),
        Index('idx_emotion_session_id', 'session_id'),
        Index('idx_emotion_created_at', 'created_at'),
    )

class AttentionTracking(Base):
    __tablename__ = 'attention_tracking'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey('learning_sessions.id'))
    
    # Attention metrics
    attention_score = Column(Float)
    focus_level = Column(String(50))
    gaze_direction = Column(String(50))
    
    # Eye tracking data
    blink_rate = Column(Float)
    eye_openness = Column(Float)
    gaze_coordinates = Column(JSON, default={})
    
    # Head pose data
    head_pose = Column(JSON, default={})
    facing_camera = Column(Boolean, default=True)
    
    # Processing metadata
    processing_time = Column(Float)
    confidence = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_attention_user_id', 'user_id'),
        Index('idx_attention_session_id', 'session_id'),
        Index('idx_attention_created_at', 'created_at'),
    )

class FatigueDetection(Base):
    __tablename__ = 'fatigue_detection'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey('learning_sessions.id'))
    
    # Fatigue metrics
    fatigue_score = Column(Float)
    fatigue_level = Column(String(50))
    
    # Fatigue indicators
    eye_closure_duration = Column(Float)
    yawn_detected = Column(Boolean, default=False)
    micro_sleep_detected = Column(Boolean, default=False)
    
    # Recommendations
    break_recommended = Column(Boolean, default=False)
    recommended_break_duration = Column(Integer)  # in minutes
    
    # Processing metadata
    processing_time = Column(Float)
    confidence = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_fatigue_user_id', 'user_id'),
        Index('idx_fatigue_session_id', 'session_id'),
        Index('idx_fatigue_created_at', 'created_at'),
    )

class UserModuleProgress(Base):
    __tablename__ = 'user_module_progress'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey('learning_modules.id'), nullable=False)
    
    completion_percentage = Column(Float, default=0)
    time_spent = Column(Float, default=0)  # in minutes
    last_accessed = Column(DateTime, default=datetime.utcnow)
    current_section = Column(String(255))
    quiz_scores = Column(JSON, default=[])
    
    # Performance tracking
    average_attention = Column(Float)
    average_engagement = Column(Float)
    struggle_points = Column(JSON, default=[])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_progress_user_module', 'user_id', 'module_id'),
        Index('idx_progress_last_accessed', 'last_accessed'),
    )

class AssessmentResult(Base):
    __tablename__ = 'assessment_results'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey('learning_modules.id'), nullable=False)
    
    assessment_type = Column(String(50), default='quiz')
    questions = Column(JSON, default=[])
    answers = Column(JSON, default=[])
    correct_answers = Column(JSON, default=[])
    
    score = Column(Float)
    time_taken = Column(Integer)  # in seconds
    attempts = Column(Integer, default=1)
    
    # Cognitive state during assessment
    cognitive_state = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_assessment_user_id', 'user_id'),
        Index('idx_assessment_module_id', 'module_id'),
        Index('idx_assessment_created_at', 'created_at'),
    )

class BreakActivity(Base):
    __tablename__ = 'break_activities'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    activity_type = Column(String(100), nullable=False)
    duration = Column(Integer)  # in minutes
    effectiveness_rating = Column(Integer)  # 1-5 scale
    notes = Column(Text)
    
    # Context
    pre_break_state = Column(JSON, default={})
    post_break_state = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_break_user_id', 'user_id'),
        Index('idx_break_activity_type', 'activity_type'),
        Index('idx_break_created_at', 'created_at'),
    )

class Discussion(Base):
    __tablename__ = 'discussions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), default='general')
    tags = Column(JSON, default=[])
    
    active = Column(Boolean, default=True)
    pinned = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    replies = relationship("DiscussionReply", back_populates="discussion")
    likes = relationship("DiscussionLike", back_populates="discussion")
    
    # Indexes
    __table_args__ = (
        Index('idx_discussion_author_id', 'author_id'),
        Index('idx_discussion_category', 'category'),
        Index('idx_discussion_created_at', 'created_at'),
        Index('idx_discussion_active', 'active'),
    )

class DiscussionReply(Base):
    __tablename__ = 'discussion_replies'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    discussion_id = Column(UUID(as_uuid=True), ForeignKey('discussions.id'), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    parent_reply_id = Column(UUID(as_uuid=True), ForeignKey('discussion_replies.id'))
    
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    discussion = relationship("Discussion", back_populates="replies")
    parent_reply = relationship("DiscussionReply", remote_side=[id])
    
    # Indexes
    __table_args__ = (
        Index('idx_reply_discussion_id', 'discussion_id'),
        Index('idx_reply_author_id', 'author_id'),
        Index('idx_reply_created_at', 'created_at'),
    )

class DiscussionLike(Base):
    __tablename__ = 'discussion_likes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    discussion_id = Column(UUID(as_uuid=True), ForeignKey('discussions.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    discussion = relationship("Discussion", back_populates="likes")
    
    # Indexes
    __table_args__ = (
        Index('idx_like_discussion_user', 'discussion_id', 'user_id', unique=True),
        Index('idx_like_created_at', 'created_at'),
    )

class Challenge(Base):
    __tablename__ = 'challenges'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    challenge_type = Column(String(100), nullable=False)
    
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reward_points = Column(Integer, default=0)
    
    requirements = Column(JSON, default={})
    active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    participants = relationship("ChallengeParticipant", back_populates="challenge")
    
    # Indexes
    __table_args__ = (
        Index('idx_challenge_type', 'challenge_type'),
        Index('idx_challenge_dates', 'start_date', 'end_date'),
        Index('idx_challenge_active', 'active'),
    )

class ChallengeParticipant(Base):
    __tablename__ = 'challenge_participants'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id = Column(UUID(as_uuid=True), ForeignKey('challenges.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    joined_at = Column(DateTime, default=datetime.utcnow)
    progress = Column(Float, default=0)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    # Relationships
    challenge = relationship("Challenge", back_populates="participants")
    
    # Indexes
    __table_args__ = (
        Index('idx_participant_challenge_user', 'challenge_id', 'user_id', unique=True),
        Index('idx_participant_joined_at', 'joined_at'),
    )

class WellnessShare(Base):
    __tablename__ = 'wellness_shares'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    mood_category = Column(String(50), nullable=False)
    message = Column(String(280), nullable=False)  # Twitter-like limit
    anonymous = Column(Boolean, default=True)
    
    active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    likes = relationship("WellnessShareLike", back_populates="share")
    
    # Indexes
    __table_args__ = (
        Index('idx_wellness_share_user_id', 'user_id'),
        Index('idx_wellness_share_mood', 'mood_category'),
        Index('idx_wellness_share_created_at', 'created_at'),
    )

class WellnessShareLike(Base):
    __tablename__ = 'wellness_share_likes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    share_id = Column(UUID(as_uuid=True), ForeignKey('wellness_shares.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    share = relationship("WellnessShare", back_populates="likes")
    
    # Indexes
    __table_args__ = (
        Index('idx_wellness_like_share_user', 'share_id', 'user_id', unique=True),
    )

class SystemSettings(Base):
    __tablename__ = 'system_settings'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(255), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(Text)
    
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_settings_key', 'key'),
    )

class ErrorLog(Base):
    __tablename__ = 'error_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    error_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    stack_trace = Column(Text)
    
    # Context data
    url = Column(String(500))
    user_agent = Column(String(500))
    component_stack = Column(Text)
    
    # Error metadata
    severity = Column(String(50), default='medium')
    resolved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_error_user_id', 'user_id'),
        Index('idx_error_type', 'error_type'),
        Index('idx_error_created_at', 'created_at'),
        Index('idx_error_severity', 'severity'),
    )

class PerformanceMetric(Base):
    __tablename__ = 'performance_metrics'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    metric_type = Column(String(100), nullable=False)
    metric_name = Column(String(255), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50))
    
    # Context
    page_url = Column(String(500))
    user_agent = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_perf_user_id', 'user_id'),
        Index('idx_perf_type', 'metric_type'),
        Index('idx_perf_created_at', 'created_at'),
    )
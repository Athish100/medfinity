from django.urls import path
from .views import (HealthRecordListCreateView, HealthRecordDetailView, PatientHealthRecordsView,
                    VitalSignsListCreateView, share_record_with_doctor, get_latest_vitals)

urlpatterns = [
    path('', HealthRecordListCreateView.as_view(), name='health-record-list'),
    path('patient/<int:patient_id>/', PatientHealthRecordsView.as_view(), name='patient-health-records'),
    path('<int:pk>/', HealthRecordDetailView.as_view(), name='health-record-detail'),
    path('<int:pk>/share/', share_record_with_doctor, name='share-record'),
    path('vitals/', VitalSignsListCreateView.as_view(), name='vitals-list'),
    path('vitals/latest/', get_latest_vitals, name='latest-vitals'),
]
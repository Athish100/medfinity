from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import HealthRecord, VitalSigns
from .serializers import HealthRecordSerializer, VitalSignsSerializer

class HealthRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = HealthRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'doctor':
            # NOTE: this used to also OR in `is_shared_with_doctor=True`,
            # which is a record-level flag meaning "shared with *some*
            # doctor" — not this one. That let any doctor list any other
            # doctor's shared patient records. Only `shared_doctors=user`
            # (the actual M2M of who it was shared with) should grant access.
            return HealthRecord.objects.filter(shared_doctors=user)
        return HealthRecord.objects.filter(patient=user)
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user, patient=self.request.user)

class HealthRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HealthRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Doctors only ever get read access to records shared with them.
        # Update/delete must stay scoped to the owning patient — otherwise a
        # doctor who was merely given *view* access could edit or delete a
        # patient's document.
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return HealthRecord.objects.filter(patient=user)
        if user.user_type == 'doctor':
            return HealthRecord.objects.filter(shared_doctors=user)
        return HealthRecord.objects.filter(patient=user)

class PatientHealthRecordsView(generics.ListAPIView):
    """
    Read-only: lets a doctor view a specific patient's uploaded documents.

    Access is granted the same way "My Patients" is computed elsewhere in
    the app (see appointments.views.doctor_patients) — a doctor can view a
    patient's records once they've had at least one appointment together.
    This intentionally does NOT require the separate per-record
    `shared_doctors` share step, since that step has no UI anywhere in the
    product yet and doctors already get full prescription/appointment
    history for their patients without it.
    """
    serializer_class = HealthRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        patient_id = self.kwargs.get('patient_id')
        if user.user_type != 'doctor':
            return HealthRecord.objects.none()

        from apps.appointments.models import Appointment
        has_relationship = Appointment.objects.filter(doctor=user, patient_id=patient_id).exists()
        if not has_relationship:
            return HealthRecord.objects.none()

        return HealthRecord.objects.filter(patient_id=patient_id).order_by('-created_at')


class VitalSignsListCreateView(generics.ListCreateAPIView):
    serializer_class = VitalSignsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VitalSigns.objects.filter(patient=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_record_with_doctor(request, pk):
    record = get_object_or_404(HealthRecord, pk=pk, patient=request.user)
    doctor_id = request.data.get('doctor_id')
    if not doctor_id:
        return Response({'error': 'doctor_id is required.'}, status=400)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    doctor = get_object_or_404(User, pk=doctor_id, user_type='doctor')

    record.shared_doctors.add(doctor)
    record.is_shared_with_doctor = True
    record.save()
    return Response({'message': 'Record shared successfully'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_latest_vitals(request):
    vitals = VitalSigns.objects.filter(patient=request.user).first()
    if vitals:
        serializer = VitalSignsSerializer(vitals)
        return Response(serializer.data)
    return Response({'message': 'No vitals recorded yet'})
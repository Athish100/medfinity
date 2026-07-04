from django.utils import timezone
from rest_framework import serializers
from .models import Appointment, AppointmentSlot
from apps.users.serializers import DoctorListSerializer
from apps.users.models import DoctorAvailability

class AppointmentSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentSlot
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    doctor_details = DoctorListSerializer(source='doctor', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'meeting_link']

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name()


class AppointmentCreateSerializer(serializers.ModelSerializer):
    appointment_time = serializers.TimeField(required=True)

    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'appointment_date', 'appointment_time', 'appointment_type',
                  'symptoms', 'notes', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']

    def validate(self, data):
        doctor = data.get('doctor')
        appt_date = data.get('appointment_date')
        appt_time = data.get('appointment_time')

        if doctor is None or getattr(doctor, 'user_type', None) != 'doctor':
            raise serializers.ValidationError({'doctor': 'Please select a valid doctor.'})

        if not doctor.is_available:
            raise serializers.ValidationError({'doctor': 'This doctor is not currently accepting appointments.'})

        if not appt_date:
            raise serializers.ValidationError({'appointment_date': 'Please select a date.'})
        if appt_date < timezone.localdate():
            raise serializers.ValidationError({'appointment_date': 'You cannot book an appointment in the past.'})

        if not appt_time:
            raise serializers.ValidationError({'appointment_time': 'Please select an available time slot.'})

        weekday_name = appt_date.strftime('%A').lower()
        slot_match = DoctorAvailability.objects.filter(
            doctor=doctor, day=weekday_name, is_available=True,
            start_time__lte=appt_time, end_time__gt=appt_time,
        ).exists()
        if not slot_match:
            raise serializers.ValidationError({
                'appointment_time': "This doctor isn't available at the selected date/time. Please choose one of their listed slots."
            })

        clash = Appointment.objects.filter(
            doctor=doctor, appointment_date=appt_date, appointment_time=appt_time,
            status__in=['scheduled', 'confirmed', 'in_progress'],
        ).exists()
        if clash:
            raise serializers.ValidationError({
                'appointment_time': 'That slot was just booked by someone else. Please choose another time.'
            })

        return data

    def create(self, validated_data):
        validated_data['patient'] = self.context['request'].user
        # Prevent booking own profile
        if validated_data['patient'] == validated_data['doctor']:
            raise serializers.ValidationError({'doctor': 'You cannot book an appointment with yourself.'})
        return super().create(validated_data)

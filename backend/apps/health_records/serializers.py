from django.utils import timezone
from rest_framework import serializers
from .models import HealthRecord, VitalSigns

class HealthRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    # Made optional with sane server-side defaults: the quick "upload a document"
    # flow shouldn't 400 just because the client didn't send a record type/date.
    record_type = serializers.ChoiceField(choices=HealthRecord.RECORD_TYPES, required=False, default='other')
    record_date = serializers.DateField(required=False)

    class Meta:
        model = HealthRecord
        fields = '__all__'
        # 'patient' is a required FK on the model (no blank=True), so DRF's
        # auto-generated field defaults to required=True. The view always
        # sets it explicitly from the logged-in user in perform_create(), so
        # it must be read-only here too — otherwise a plain document upload
        # (which only sends file/title/record_type/record_date) always fails
        # validation with "patient: This field is required." before
        # perform_create() is even reached.
        read_only_fields = ['created_at', 'uploaded_by', 'patient']

    def create(self, validated_data):
        validated_data.setdefault('record_date', timezone.localdate())
        if not validated_data.get('title'):
            f = validated_data.get('file')
            validated_data['title'] = getattr(f, 'name', 'Document')
        return super().create(validated_data)

class VitalSignsSerializer(serializers.ModelSerializer):
    bmi = serializers.SerializerMethodField()
    
    class Meta:
        model = VitalSigns
        fields = '__all__'
        read_only_fields = ['recorded_at']
    
    def get_bmi(self, obj):
        if obj.weight_kg and obj.height_cm:
            height_m = obj.height_cm / 100
            return round(float(obj.weight_kg) / (height_m ** 2), 2)
        return None
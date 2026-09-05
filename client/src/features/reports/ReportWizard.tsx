import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { errorMessage } from '../../services/errorMessage';
import { useAuth } from '../../services/auth.context';
import { uploadFreeImage, compressImageToDataUrl } from '../../services/imageUpload';
import { LocationPicker } from '../../components/map/LocationPicker';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { AuthModal } from '../auth/AuthModal';
import {
  MapPin,
  Tag,
  Camera,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  Link2,
  Sparkles,
  AlertCircle,
  FileCheck,
  X,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

import { Category } from '../../types';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1000000-0000-0000-0000-000000000001', name: 'Road & Potholes', slug: 'road-potholes', icon: 'Construction', is_active: true, created_at: '' },
  { id: 'c1000000-0000-0000-0000-000000000002', name: 'Street Lighting', slug: 'street-lighting', icon: 'Lightbulb', is_active: true, created_at: '' },
  { id: 'c1000000-0000-0000-0000-000000000003', name: 'Waste & Sanitation', slug: 'waste-sanitation', icon: 'Trash2', is_active: true, created_at: '' },
  { id: 'c1000000-0000-0000-0000-000000000004', name: 'Sidewalks & Walkways', slug: 'sidewalks', icon: 'Footprints', is_active: true, created_at: '' },
  { id: 'c1000000-0000-0000-0000-000000000005', name: 'Water & Drainage', slug: 'water-drainage', icon: 'Droplets', is_active: true, created_at: '' },
  { id: 'c1000000-0000-0000-0000-000000000006', name: 'Public Parks & Trees', slug: 'parks-trees', icon: 'Trees', is_active: true, created_at: '' },
];

export const ReportWizard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState('');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Form State
  const [latitude, setLatitude] = useState<number>(39.9255);
  const [longitude, setLongitude] = useState<number>(32.8662);
  const [address, setAddress] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Submission result
  const [submissionResult, setSubmissionResult] = useState<{
    matched_issue_id: string;
    is_new_issue: boolean;
    distance_meters: number;
  } | null>(null);

  const { data: serverCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const categories = serverCategories && serverCategories.length > 0 ? serverCategories : DEFAULT_CATEGORIES;

  const submitMutation = useMutation({
    mutationFn: async () => {
      let finalImageUrl = imageUrl;
      if (selectedImageFile) {
        finalImageUrl = await uploadFreeImage(selectedImageFile, imagePreview || undefined);
      } else if (imagePreview) {
        finalImageUrl = imagePreview;
      }

      return api.createReport({
        category_id: categoryId,
        description,
        latitude,
        longitude,
        title: title || undefined,
        image_url: finalImageUrl || undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      setSubmissionResult(data);
      setCurrentStep(5);
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const errors: Record<string, string> = {};
      if (!categoryId) errors.category = t('reportWizard.categoryPlaceholder');
      if (description.trim().length < 5) errors.description = t('errors.description');
      setFieldErrors(errors);
      if (Object.keys(errors).length) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!user) {
        setIsAuthOpen(true);
        return;
      }
      submitMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageFileName, setImageFileName] = useState<string>('');

  const compressAndSetImage = async (file: File) => {
    setImageError('');
    handleRemoveImage();
    try {
      setIsCompressingImage(true);
      
      const compressedDataUrl = await compressImageToDataUrl(file);
      setImageFileName(file.name);
      setSelectedImageFile(file);
      setImagePreview(compressedDataUrl);
      setImageUrl('');
    } catch (err) {
      const key = err instanceof Error && ['imageType', 'imageSize'].includes(err.message) ? err.message : 'imageProcess';
      setImageError(t(`errors.${key}`));
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl('');
    setImageFileName('');
    setSelectedImageFile(null);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="app-container" style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '720px' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>
          {t('reportWizard.title')}
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          {t('reportWizard.subtitle')}
        </p>
      </div>

      {/* 5-Step Progress Indicator */}
      {currentStep < 5 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-8)',
            position: 'relative',
          }}
        >
          {[1, 2, 3, 4].map((step) => {
            const isCompleted = currentStep > step;
            const isCurrent = currentStep === step;

            return (
              <div
                key={step}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: isCurrent || isCompleted
                      ? 'var(--accent-primary)'
                      : 'var(--bg-surface-subtle)',
                    color: isCurrent || isCompleted ? 'white' : 'var(--text-tertiary)',
                    border: '2px solid var(--border-default)',
                    transition: 'all var(--transition-normal)',
                  }}
                >
                  {isCompleted ? <CheckCircle size={16} /> : step}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {step === 1 && t('reportWizard.step1')}
                  {step === 2 && t('reportWizard.step2')}
                  {step === 3 && t('reportWizard.step3')}
                  {step === 4 && t('reportWizard.step4')}
                </span>
              </div>
            );
          })}

          {/* Progress bar background line */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              insetInlineStart: '20px',
              insetInlineEnd: '20px',
              height: '2px',
              backgroundColor: 'var(--border-default)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--accent-primary)',
                width: `${((currentStep - 1) / 3) * 100}%`,
                transition: 'width var(--transition-normal)',
              }}
            />
          </div>
        </div>
      )}

      {/* Step Contents */}
      <div className="card" style={{ padding: 'var(--space-6)', backgroundColor: 'var(--bg-surface-elevated)' }}>
        {/* STEP 1: LOCATION */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>{t('reportWizard.step1')}</span>
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              {t('reportWizard.selectLocationInstruction')}
            </p>

            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lon, addr) => {
                setLatitude(lat);
                setLongitude(lon);
                setAddress(addr || '');
              }}
            />
          </div>
        )}

        {/* STEP 2: CATEGORY & DESCRIPTION */}
        {currentStep === 2 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>{t('reportWizard.step2')}</span>
            </h3>

            {/* Category Grid Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px' }}>
                {t('reportWizard.categoryLabel')} *
              </label>
              {fieldErrors.category && <p className="field-error" role="alert">{fieldErrors.category}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {categories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '2px solid var(--accent-primary)'
                          : '1px solid var(--border-default)',
                        backgroundColor: isSelected
                          ? 'var(--accent-subtle)'
                          : 'var(--bg-surface)',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'center',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <CategoryIcon slug={cat.slug} size={22} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 600 : 400 }}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('reportWizard.issueTitleLabel')}
              </label>
              <input
                type="text"
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('reportWizard.issueTitlePlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('reportWizard.descriptionLabel')} *
              </label>
              <textarea
                aria-label={t('reportWizard.descriptionLabel')}
                aria-invalid={!!fieldErrors.description}
                aria-describedby="description-error"
                maxLength={2000}
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('reportWizard.descriptionPlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  resize: 'vertical',
                }}
              />
              {fieldErrors.description && <p id="description-error" className="field-error" role="alert">{fieldErrors.description}</p>}
            </div>
          </div>
        )}

        {/* STEP 3: OPTIONAL PHOTO */}
        {currentStep === 3 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {imageError && <p className="field-error" role="alert">{imageError}</p>}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>{t('reportWizard.step3')}</span>
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {t('reportWizard.photoInstruction')}
            </p>

            {/* Selected Image Card */}
            {(imagePreview || imageUrl) ? (
              <div
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <img
                    src={imagePreview || imageUrl}
                    alt="Uploaded issue evidence"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <ImageIcon size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {imageFileName || 'Attached Photo'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--status-resolved)', marginBottom: '8px' }}>
                    ✓ Photo ready for submission
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn btn-subtle"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      color: 'var(--status-rejected)',
                      borderColor: 'var(--status-rejected-border)',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* File Upload / Camera Dropzone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    border: isDragging
                      ? '2px dashed var(--accent-primary)'
                      : '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8) var(--space-4)',
                    textAlign: 'center',
                    backgroundColor: isDragging
                      ? 'var(--accent-subtle)'
                      : 'var(--bg-surface-subtle)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isCompressingImage}
                    onChange={handleImageFileChange}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                  {isCompressingImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Optimizing image...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} style={{ margin: '0 auto 10px', color: 'var(--text-tertiary)' }} />
                      <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Click to choose photo or take camera picture
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Drag & drop or browse (PNG, JPG, WebP — automatically optimized)
                      </div>
                    </>
                  )}
                </div>

                {/* Direct URL alternative */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '6px' }}>
                    {t('reportWizard.photoUrlPlaceholder')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(null);
                      }}
                      placeholder="https://example.com/pothole.jpg"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        paddingInlineStart: '36px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    />
                    <Link2
                      size={16}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        insetInlineStart: '12px',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {currentStep === 4 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>{t('reportWizard.reviewTitle')}</span>
            </h3>

            {/* Smart Deduplication Banner */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                color: 'var(--accent-primary)',
              }}
            >
              <Sparkles size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {t('reportWizard.reviewNotice')}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.875rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Category: </span>
                <span style={{ fontWeight: 600 }}>{selectedCategory?.name || 'Unspecified'}</span>
              </div>
              {title && (
                <div>
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Title: </span>
                  <span style={{ fontWeight: 600 }}>{title}</span>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Location: </span>
                <span>
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
                {address && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{address}</div>}
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Description: </span>
                <p style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{description}</p>
              </div>
              {(imagePreview || imageUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img
                      src={imagePreview || imageUrl}
                      alt="Attached evidence preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Photo attached
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {imageFileName || 'Image evidence'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {submitMutation.isError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--status-rejected-bg)',
                  color: 'var(--status-rejected)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                {errorMessage(submitMutation.error)}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: SUCCESS CONFIRMATION & HAVERSINE RESULT */}
        {currentStep === 5 && submissionResult && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-resolved-bg)',
                color: 'var(--status-resolved)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              {t('reportWizard.successTitle')}
            </h2>

            {/* Distinct feedback for deduplicated match vs new issue */}
            {submissionResult.is_new_issue ? (
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-secondary)',
                  maxWidth: '480px',
                  margin: '0 auto var(--space-6)',
                  lineHeight: 1.6,
                }}
              >
                {t('reportWizard.newIssueCreated')}
              </p>
            ) : (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-primary)',
                  maxWidth: '480px',
                  margin: '0 auto var(--space-6)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  textAlign: 'start',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Attached to Existing Community Issue
                </div>
                {t('reportWizard.attachedToExisting', {
                  distance: submissionResult.distance_meters,
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link to={`/issues/${submissionResult.matched_issue_id}`} className="btn btn-primary">
                <span>{t('reportWizard.viewIssue')}</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDescription('');
                  setTitle('');
                  setImagePreview(null);
                  setImageUrl('');
                  setSelectedImageFile(null);
                  setImageFileName('');
                  setImageError('');
                  setFieldErrors({});
                  setSubmissionResult(null);
                  setCurrentStep(1);
                }}
                className="btn btn-secondary"
              >
                {t('reportWizard.createAnother')}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Control Navigation Buttons */}
        {currentStep < 5 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || submitMutation.isPending}
              className="btn btn-subtle"
            >
              <ArrowLeft size={16} />
              <span>{t('reportWizard.back')}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitMutation.isPending || isCompressingImage}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t('reportWizard.submitting')}</span>
                </>
              ) : currentStep === 4 ? (
                <>
                  <span>{t('reportWizard.submitButton')}</span>
                  <CheckCircle size={16} />
                </>
              ) : (
                <>
                  <span>{t('reportWizard.next')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

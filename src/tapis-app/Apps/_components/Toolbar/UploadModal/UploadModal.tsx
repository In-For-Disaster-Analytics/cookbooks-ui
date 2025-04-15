import { Button, Form, FormGroup, Input } from 'reactstrap';
import { GenericModal } from 'tapis-ui/_common';
import { SubmitWrapper } from 'tapis-ui/_wrappers';
import { ToolbarModalProps } from '../Toolbar';
import styles from './UploadModal.module.scss';
import { useCreate } from 'tapis-hooks/apps';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Apps } from '@tapis/tapis-typescript';
import { focusManager } from 'react-query';

export enum FileOpEventStatus {
  loading = 'loading',
  progress = 'progress',
  error = 'error',
  success = 'success',
  none = 'none',
}

export type FileProgressState = {
  [name: string]: number;
};

type UploadModalProps = ToolbarModalProps & {
  maxFileSizeBytes?: number;
};

// Minimal required fields for app validation
const requiredAppFields = ['id', 'version', 'containerImage'];

const UploadModal: React.FC<UploadModalProps> = ({ toggle }) => {
  const { isLoading, error, isSuccess, submit, data } = useCreate();

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [app, setApp] = useState<Apps.ReqPostApp | null>(null);
  const [appId, setAppId] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'url' | null>(null);
  const [validationState, setValidationState] = useState<
    'valid' | 'invalid' | 'none'
  >('none');
  const [validationError, setValidationError] = useState<string>('');

  // Validate the app specification
  const validateAppSpec = (data: any): boolean => {
    // Check if it's a valid JSON object
    if (!data || typeof data !== 'object') {
      setValidationError('Invalid JSON format: Not a valid object');
      return false;
    }

    // Check for required fields
    const missingFields = requiredAppFields.filter((field) => !(field in data));
    if (missingFields.length > 0) {
      setValidationError(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
      return false;
    }

    // Additional validation can be added here for field formats, etc.
    return true;
  };

  useEffect(() => {
    const loadAppData = async () => {
      try {
        if (file) {
          const contents = await file.text();
          try {
            const data = JSON.parse(contents);

            if (validateAppSpec(data)) {
              setApp(data as Apps.ReqPostApp);
              setAppId(data.id || '');
              setValidationState('valid');
              setValidationError('');
            } else {
              setValidationState('invalid');
              setApp(null);
            }
          } catch (err) {
            setValidationState('invalid');
            setValidationError('Invalid JSON format: Unable to parse file');
            setApp(null);
          }
        } else if (url) {
          try {
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(
                `Failed to fetch: ${response.status} ${response.statusText}`,
              );
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              setValidationState('invalid');
              setValidationError('URL does not point to a JSON file');
              setApp(null);
              return;
            }

            const data = await response.json();

            if (validateAppSpec(data)) {
              setApp(data as Apps.ReqPostApp);
              setAppId(data.id || '');
              setValidationState('valid');
              setValidationError('');
            } else {
              setValidationState('invalid');
              setApp(null);
            }
          } catch (err) {
            setValidationState('invalid');
            setValidationError(
              `Error fetching from URL: ${err instanceof Error ? err.message : String(err)}`,
            );
            setApp(null);
          }
        } else {
          setValidationState('none');
          setValidationError('');
        }
      } catch (err) {
        setValidationState('invalid');
        setValidationError(
          `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        );
        setApp(null);
      }
    };
    loadAppData();
  }, [file, url]);

  useEffect(() => {
    if (isSuccess) {
      focusManager.setFocused(true);
    }
    setFile(null);
    setUrl('');
    setAppId('');
    setInputMode(null);
    setValidationState('none');
    setValidationError('');
  }, [isSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUrl('');
      setInputMode('file');
      setValidationState('none');
      setValidationError('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setFile(null);
    setInputMode('url');
    setValidationState('none');
    setValidationError('');
  };

  const handleFileClick = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ) => {
    const element = e.target as HTMLInputElement;
    element.value = '';
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (app !== null) {
      // Only override the ID if the user has changed it
      if (appId && appId !== app.id) {
        submit({ ...app, id: appId });
      } else {
        submit(app);
      }
    }
  };

  const inputFile = useRef(null);
  return (
    <GenericModal
      toggle={toggle}
      title="Create New Application"
      body={
        <div className={styles.uploadModalBody}>
          <div className={styles.summary}>
            Create a new application by uploading a specification
          </div>

          <Form onSubmit={onSubmit}>
            {/* Step 1: Choose upload method */}
            <div className={styles.formSection}>
              <div className={styles.stepHeader}>
                <div className={styles.stepBadge}>1</div>
                <div className={styles.stepTitle}>Choose Upload Method</div>
              </div>

              <div className={styles.optionsContainer}>
                <div
                  className={`${styles.optionCard} ${inputMode === 'file' ? styles.selectedOption : ''} ${validationState === 'invalid' && inputMode === 'file' ? styles.invalidOption : ''} ${validationState === 'valid' && inputMode === 'file' ? styles.validOption : ''}`}
                >
                  <div className={styles.optionHeader}>
                    <div className={styles.optionTitle}>Upload JSON File</div>
                  </div>
                  <Input
                    type="file"
                    name="file"
                    id="file"
                    ref={inputFile}
                    onChange={handleFileChange}
                    onClick={handleFileClick}
                    className={styles.input}
                    accept=".json,application/json"
                    disabled={inputMode === 'url'}
                  />
                  <small className={styles.helperText}>
                    Select a JSON file with the application specification.
                  </small>
                </div>

                <div className={styles.orCircle}>OR</div>

                <div
                  className={`${styles.optionCard} ${inputMode === 'url' ? styles.selectedOption : ''} ${validationState === 'invalid' && inputMode === 'url' ? styles.invalidOption : ''} ${validationState === 'valid' && inputMode === 'url' ? styles.validOption : ''}`}
                >
                  <div className={styles.optionHeader}>
                    <div className={styles.optionTitle}>Provide JSON URL</div>
                  </div>
                  <Input
                    type="text"
                    name="url"
                    id="url"
                    placeholder="Paste a link to a JSON file"
                    value={url}
                    onChange={handleUrlChange}
                    className={styles.input}
                    disabled={inputMode === 'file'}
                  />
                  <small className={styles.helperText}>
                    Provide a direct link to a JSON file (e.g., from GitHub).
                  </small>
                </div>
              </div>

              {validationState === 'invalid' && (
                <div className={styles.validationError}>
                  <div className={styles.errorIcon}>!</div>
                  <div className={styles.errorMessage}>
                    {validationError || 'Invalid application specification'}
                  </div>
                </div>
              )}

              {validationState === 'valid' && (
                <div className={styles.validationSuccess}>
                  <div className={styles.successIcon}>✓</div>
                  <div className={styles.successMessage}>
                    Valid application specification detected
                  </div>
                </div>
              )}
            </div>

            <div className={styles.divider}></div>

            {/* Step 2: Customize Application ID (Optional) */}
            <div
              className={`${styles.formSection} ${!app ? styles.disabledSection : ''}`}
            >
              <div className={styles.stepHeader}>
                <div className={styles.stepBadge}>2</div>
                <div className={styles.stepTitle}>
                  Customize Application ID
                  <span className={styles.optionalBadge}>Optional</span>
                </div>
              </div>

              <div className={styles.idFormContainer}>
                <FormGroup>
                  <label htmlFor="appId" className={styles.label}>
                    Application ID
                  </label>
                  <Input
                    type="text"
                    name="appId"
                    id="appId"
                    placeholder="Override the Application ID (optional)"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className={styles.input}
                    disabled={!app}
                  />
                  <small className={styles.helperText}>
                    {app ? (
                      <>
                        <span className={styles.detectedId}>
                          ID from file: <strong>{app?.id || ''}</strong>
                        </span>
                        {app?.id !== appId && appId && (
                          <span className={styles.overriddenId}>
                            {' '}
                            → You're overriding with: <strong>{appId}</strong>
                          </span>
                        )}
                      </>
                    ) : (
                      'Upload a valid application specification first'
                    )}
                  </small>
                </FormGroup>
              </div>
            </div>

            <div className={styles.submitContainer}>
              <SubmitWrapper
                isLoading={isLoading}
                error={error}
                success={isSuccess ? `Application created` : ''}
              >
                <Button
                  className={styles.submit}
                  color="primary"
                  block
                  disabled={
                    isLoading ||
                    isSuccess ||
                    (!file && !url) ||
                    validationState !== 'valid'
                  }
                >
                  Create Application
                </Button>
              </SubmitWrapper>
            </div>
          </Form>
        </div>
      }
      size="lg"
      className={styles.wideModal}
    />
  );
};

export default UploadModal;

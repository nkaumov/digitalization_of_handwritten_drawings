import { useEffect, useMemo, useState, type ChangeEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppConfig } from '@/config/ConfigProvider';
import { editorShellMockDrawing } from '@/features/editor-shell/mockDrawing';
import {
  createDrawingInBackend,
  fetchDrawingById,
  fetchDrawingsList,
  getRecognitionJobResult,
  getRecognitionJobStatus,
  isBackendDrawingId,
  MAX_SOURCE_IMAGE_SIZE_BYTES,
  normalizeBackendDrawingId,
  saveDrawingToBackend,
  startRecognitionJob,
  uploadSourceImage,
  updateDrawingMeta,
  type DrawingsListItem,
} from '@/features/editor-shell/api';
import { useDrawingEditor } from '@/features/editor-shell/useDrawingEditor';
import { useGeometrySelection } from '@/features/editor-shell/useGeometrySelection';
import { ViewportCanvas } from '@/features/editor-shell/ViewportCanvas';
import { useViewportNavigation } from '@/features/editor-shell/viewport';

type ScreenMode = 'list' | 'editor';
type CreateModalMode = 'choice' | 'ai-upload';
type AiFlowStatus =
  | 'idle'
  | 'uploading'
  | 'starting'
  | 'processing'
  | 'fetchingResult'
  | 'openingDrawing'
  | 'failed';

const SNAP_DISTANCE = 10;
const CONNECTED_HIGHLIGHT_MS = 650;
const RECOGNITION_POLL_INTERVAL_MS = 900;
const RECOGNITION_MAX_POLL_ATTEMPTS = 45;

export function EditorShellPage() {
  const { t, i18n } = useTranslation();
  const config = useAppConfig();
  const navigation = useViewportNavigation();
  const drawingEditor = useDrawingEditor(editorShellMockDrawing);
  const selectionApi = useGeometrySelection();

  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [drawings, setDrawings] = useState<DrawingsListItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<CreateModalMode>('choice');
  const [createPhotoFile, setCreatePhotoFile] = useState<File | null>(null);
  const [isAiFlowRunning, setIsAiFlowRunning] = useState(false);
  const [aiFlowStatus, setAiFlowStatus] = useState<AiFlowStatus>('idle');
  const [aiFlowMessage, setAiFlowMessage] = useState('');

  const [remoteDrawingId, setRemoteDrawingId] = useState<string | null>(null);
  const [drawingTitle, setDrawingTitle] = useState('');
  const [isLoadingDrawing, setIsLoadingDrawing] = useState(false);
  const [isSavingDrawing, setIsSavingDrawing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [connectedSegmentKeys, setConnectedSegmentKeys] = useState<string[]>([]);
  const [isDimensionLockEnabled, setIsDimensionLockEnabled] = useState(true);
  const [clipboardSegments, setClipboardSegments] = useState<Array<{ contourId: string; segmentId: string }>>([]);
  const [pasteCounter, setPasteCounter] = useState(1);

  const warningCount = drawingEditor.geometryWarnings.length;

  const selectedLabel = useMemo(() => {
    if (selectionApi.selectedSegments.length > 1) {
      return t('editor.selection.twoSegments', { count: selectionApi.selectedSegments.length });
    }

    if (selectionApi.selectedSegment) {
      return t('editor.selection.segment', {
        contourId: selectionApi.selectedSegment.contourId,
        segmentId: selectionApi.selectedSegment.segmentId,
      });
    }

    if (selectionApi.selectedPoints.length === 0) {
      return t('editor.selection.none');
    }

    if (selectionApi.selectedPoints.length === 1) {
      const [point] = selectionApi.selectedPoints;
      if (!point) {
        return t('editor.selection.none');
      }

      return t('editor.selection.point', {
        contourId: point.contourId,
        pointId: point.pointId,
      });
    }

    const [first, second] = selectionApi.selectedPoints;
    return t('editor.selection.twoPoints', {
      first: `${first?.contourId}:${first?.pointId}`,
      second: `${second?.contourId}:${second?.pointId}`,
    });
  }, [selectionApi.selectedPoints, selectionApi.selectedSegment, selectionApi.selectedSegments.length, t]);

  const selectedSegmentMetrics = useMemo(() => {
    if (!selectionApi.selectedSegment || selectionApi.selectedSegments.length !== 1) {
      return null;
    }

    const segmentNode = drawingEditor.scene.segments.find(
      (segment) =>
        segment.contourId === selectionApi.selectedSegment?.contourId &&
        segment.segment.id === selectionApi.selectedSegment?.segmentId,
    );
    if (!segmentNode) {
      return null;
    }

    const dx = segmentNode.to.x - segmentNode.from.x;
    const dy = segmentNode.to.y - segmentNode.from.y;

    return {
      contourId: segmentNode.contourId,
      segmentId: segmentNode.segment.id,
      length: Math.hypot(dx, dy),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      isConnectedToOtherSegments: drawingEditor.scene.segments.some(
        (candidate) =>
          candidate.contourId === segmentNode.contourId &&
          candidate.segment.id !== segmentNode.segment.id &&
          (candidate.from.id === segmentNode.from.id ||
            candidate.to.id === segmentNode.from.id ||
            candidate.from.id === segmentNode.to.id ||
            candidate.to.id === segmentNode.to.id),
      ),
    };
  }, [drawingEditor.scene.segments, selectionApi.selectedSegment, selectionApi.selectedSegments.length]);

  const [segmentLengthInput, setSegmentLengthInput] = useState('');
  const [segmentAngleInput, setSegmentAngleInput] = useState('');

  const resetCreateModalState = () => {
    setCreateModalMode('choice');
    setCreatePhotoFile(null);
    setIsAiFlowRunning(false);
    setAiFlowStatus('idle');
    setAiFlowMessage('');
  };

  const openCreateModal = () => {
    resetCreateModalState();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isAiFlowRunning) {
      return;
    }
    setIsCreateModalOpen(false);
    resetCreateModalState();
  };

  useEffect(() => {
    if (!selectedSegmentMetrics) {
      setSegmentLengthInput('');
      setSegmentAngleInput('');
      return;
    }

    setSegmentLengthInput(selectedSegmentMetrics.length.toFixed(1));
    setSegmentAngleInput(selectedSegmentMetrics.angle.toFixed(1));
  }, [selectedSegmentMetrics]);

  const refreshDrawingsList = async () => {
    setIsListLoading(true);

    try {
      const response = await fetchDrawingsList(config.apiBaseUrl);
      setDrawings(response.items);
    } catch (error) {
      setSyncMessage(
        t('home.errors.loadListFailed', {
          message: error instanceof Error ? error.message : 'unknown-error',
        }),
      );
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    void refreshDrawingsList();
  }, []);

  const openDrawingById = async (rawDrawingId: string) => {
    const requestedId = normalizeBackendDrawingId(rawDrawingId);
    if (!requestedId) {
      return;
    }

    setIsLoadingDrawing(true);
    setSyncMessage('');

    try {
      const response = await fetchDrawingById(config.apiBaseUrl, requestedId);
      drawingEditor.replaceDrawing(response.payload);
      setRemoteDrawingId(response.id);
      setDrawingTitle(response.title);
      setScreenMode('editor');
      selectionApi.clear();
      setSyncMessage(t('editor.sync.messages.loadSuccess'));
    } catch (error) {
      setSyncMessage(
        t('editor.sync.errors.loadFailed', {
          message: error instanceof Error ? error.message : 'unknown-error',
        }),
      );
    } finally {
      setIsLoadingDrawing(false);
    }
  };

  const handleCreateBlankDrawing = async () => {
    setSyncMessage('');

    try {
      const created = await createDrawingInBackend(config.apiBaseUrl, {
        title: t('home.create.defaultTitle'),
        sourceType: 'blank',
        locale: i18n.language,
      });

      closeCreateModal();
      await refreshDrawingsList();
      await openDrawingById(created.id);
    } catch (error) {
      setSyncMessage(
        t('home.errors.createFailed', {
          message: error instanceof Error ? error.message : 'unknown-error',
        }),
      );
    }
  };

  const handleAiFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setCreatePhotoFile(file);
    setAiFlowMessage('');
    setAiFlowStatus('idle');
  };

  const validateCreatePhotoFile = (file: File | null): string | null => {
    if (!file) {
      return t('home.create.ai.errors.noFileSelected');
    }

    if (!file.type.startsWith('image/')) {
      return t('home.create.ai.errors.invalidMime');
    }

    if (file.size > MAX_SOURCE_IMAGE_SIZE_BYTES) {
      return t('home.create.ai.errors.fileTooLarge', {
        maxMb: Math.round(MAX_SOURCE_IMAGE_SIZE_BYTES / (1024 * 1024)),
      });
    }

    return null;
  };

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const handleCreateFromPhoto = async () => {
    const validationError = validateCreatePhotoFile(createPhotoFile);
    if (validationError) {
      setAiFlowStatus('failed');
      setAiFlowMessage(validationError);
      return;
    }

    const file = createPhotoFile;
    if (!file) {
      return;
    }

    setIsAiFlowRunning(true);
    setAiFlowMessage('');
    setAiFlowStatus('uploading');

    try {
      const createdDrawing = await createDrawingInBackend(config.apiBaseUrl, {
        title: t('home.create.defaultTitle'),
        sourceType: 'photo',
        locale: i18n.language,
      });

      const uploadedFile = await uploadSourceImage(config.apiBaseUrl, file);

      setAiFlowStatus('starting');
      const recognition = await startRecognitionJob(config.apiBaseUrl, {
        drawingId: createdDrawing.id,
        fileId: uploadedFile.id,
      });

      setAiFlowStatus('processing');
      let attempts = 0;
      let isCompleted = false;
      while (attempts < RECOGNITION_MAX_POLL_ATTEMPTS) {
        attempts += 1;

        const status = await getRecognitionJobStatus(config.apiBaseUrl, recognition.jobId);
        if (status.status === 'completed') {
          isCompleted = true;
          break;
        }

        if (status.status === 'failed') {
          throw new Error(t('home.create.ai.errors.recognitionFailed'));
        }

        await sleep(RECOGNITION_POLL_INTERVAL_MS);
      }

      if (!isCompleted) {
        throw new Error(t('home.create.ai.errors.recognitionTimeout'));
      }

      setAiFlowStatus('fetchingResult');
      await getRecognitionJobResult(config.apiBaseUrl, recognition.jobId);

      setAiFlowStatus('openingDrawing');
      await refreshDrawingsList();
      setIsCreateModalOpen(false);
      resetCreateModalState();
      await openDrawingById(createdDrawing.id);
    } catch (error) {
      setAiFlowStatus('failed');
      setAiFlowMessage(
        t('home.create.ai.errors.flowFailed', {
          message: error instanceof Error ? error.message : t('home.errors.unknown'),
        }),
      );
    } finally {
      setIsAiFlowRunning(false);
    }
  };

  const handleSaveDrawing = async () => {
    const candidateId = normalizeBackendDrawingId(remoteDrawingId ?? '');

    if (!isBackendDrawingId(candidateId)) {
      setSyncMessage(t('editor.sync.errors.noDrawingSelected'));
      return;
    }

    setIsSavingDrawing(true);

    try {
      await updateDrawingMeta(config.apiBaseUrl, candidateId, {
        title: drawingTitle.trim() || t('home.create.defaultTitle'),
        locale: i18n.language,
      });

      await saveDrawingToBackend(config.apiBaseUrl, candidateId, {
        ...drawingEditor.drawing,
        drawingId: candidateId,
      });

      setSyncMessage(t('editor.sync.messages.saveSuccess'));
      await refreshDrawingsList();
    } catch (error) {
      setSyncMessage(
        t('editor.sync.errors.saveFailed', {
          message: error instanceof Error ? error.message : 'unknown-error',
        }),
      );
    } finally {
      setIsSavingDrawing(false);
    }
  };

  const handleLengthChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSegmentLengthInput(event.target.value);
    if (!selectedSegmentMetrics) {
      return;
    }
    if (isDimensionLockEnabled) {
      setSyncMessage(t('editor.sync.errors.lengthEditLocked'));
      return;
    }
    if (selectedSegmentMetrics.isConnectedToOtherSegments) {
      return;
    }

    const value = Number.parseFloat(event.target.value.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    drawingEditor.updateSegmentLength(
      {
        contourId: selectedSegmentMetrics.contourId,
        segmentId: selectedSegmentMetrics.segmentId,
      },
      value,
    );
  };

  const handleAngleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSegmentAngleInput(event.target.value);
    if (!selectedSegmentMetrics) {
      return;
    }
    if (selectedSegmentMetrics.isConnectedToOtherSegments) {
      return;
    }

    const value = Number.parseFloat(event.target.value.replace(',', '.'));
    if (!Number.isFinite(value)) {
      return;
    }

    drawingEditor.updateSegmentAngle(
      {
        contourId: selectedSegmentMetrics.contourId,
        segmentId: selectedSegmentMetrics.segmentId,
      },
      value,
    );
  };

  const handleAddLineWithPrompt = () => {
    const raw = window.prompt(t('editor.left.addDefaultLinePrompt'), '140');
    if (raw === null) {
      return;
    }

    const parsed = Number.parseFloat(raw.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSyncMessage(t('editor.left.addDefaultLineInvalid'));
      return;
    }

    drawingEditor.addDefaultLine(parsed);
  };

  const handleAddRectangleWithPrompt = () => {
    const rawWidth = window.prompt(t('editor.left.addRectangleWidthPrompt'), '240');
    if (rawWidth === null) {
      return;
    }

    const width = Number.parseFloat(rawWidth.replace(',', '.'));
    if (!Number.isFinite(width) || width <= 0) {
      setSyncMessage(t('editor.left.addRectangleInvalid'));
      return;
    }

    const rawLength = window.prompt(t('editor.left.addRectangleLengthPrompt'), '140');
    if (rawLength === null) {
      return;
    }

    const length = Number.parseFloat(rawLength.replace(',', '.'));
    if (!Number.isFinite(length) || length <= 0) {
      setSyncMessage(t('editor.left.addRectangleInvalid'));
      return;
    }

    drawingEditor.addRectangleContour(width, length);
  };

  const handlePointSelect = (contourId: string, pointId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      selectionApi.togglePoint(contourId, pointId);
      return;
    }

    selectionApi.selectPointExclusive(contourId, pointId);
  };

  const handleCanvasPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button === 1) {
      navigation.onPointerDown(event);
      return;
    }

    const target = event.target as HTMLElement;
    if (!target.closest('[data-interactive="true"]')) {
      selectionApi.clear();
    }

    navigation.onPointerDown(event);
  };

  const findConnectedHighlightForSegment = (
    contourId: string,
    segmentId: string,
    projectedEndpoints?: Array<{ pointId: string; x: number; y: number }>,
  ): string[] => {
    const segment = drawingEditor.scene.segments.find(
      (item) => item.contourId === contourId && item.segment.id === segmentId,
    );
    if (!segment) {
      return [];
    }

    const endpoints =
      projectedEndpoints ??
      [
        { pointId: segment.from.id, x: segment.from.x, y: segment.from.y },
        { pointId: segment.to.id, x: segment.to.x, y: segment.to.y },
      ];

    const highlight = new Set<string>();

    for (const endpoint of endpoints) {
      const nearest = drawingEditor.scene.points.find((item) => {
        if (item.contourId !== contourId || item.point.id === endpoint.pointId) {
          return false;
        }

        return Math.hypot(item.point.x - endpoint.x, item.point.y - endpoint.y) <= SNAP_DISTANCE;
      });

      if (!nearest) {
        continue;
      }

      highlight.add(`${contourId}:${segmentId}`);

      for (const candidate of drawingEditor.scene.segments) {
        if (
          candidate.contourId === contourId &&
          candidate.segment.id !== segmentId &&
          (candidate.from.id === nearest.point.id || candidate.to.id === nearest.point.id)
        ) {
          highlight.add(`${candidate.contourId}:${candidate.segment.id}`);
        }
      }
    }

    return [...highlight];
  };

  const collectConnectedSegmentRefs = (contourId: string, seedSegmentId: string) => {
    const contourSegments = drawingEditor.scene.segments.filter((item) => item.contourId === contourId);
    const byId = new Map(contourSegments.map((item) => [item.segment.id, item]));
    const pointToSegments = new Map<string, Set<string>>();

    for (const segment of contourSegments) {
      const currentFrom = pointToSegments.get(segment.from.id) ?? new Set<string>();
      currentFrom.add(segment.segment.id);
      pointToSegments.set(segment.from.id, currentFrom);

      const currentTo = pointToSegments.get(segment.to.id) ?? new Set<string>();
      currentTo.add(segment.segment.id);
      pointToSegments.set(segment.to.id, currentTo);
    }

    const visited = new Set<string>();
    const queue: string[] = [seedSegmentId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);
      const current = byId.get(currentId);
      if (!current) {
        continue;
      }

      const neighborIds = [
        ...(pointToSegments.get(current.from.id) ?? new Set<string>()),
        ...(pointToSegments.get(current.to.id) ?? new Set<string>()),
      ];

      for (const neighborId of neighborIds) {
        if (!visited.has(neighborId)) {
          queue.push(neighborId);
        }
      }
    }

    return [...visited].map((segmentId) => ({ contourId, segmentId }));
  };

  const handlePointDragEnd = (contourId: string, pointId: string, x: number, y: number) => {
    const nearest = drawingEditor.scene.points.find((item) => {
      if (item.point.id === pointId && item.contourId === contourId) {
        return false;
      }

      const distance = Math.hypot(item.point.x - x, item.point.y - y);
      return distance <= SNAP_DISTANCE;
    });

    if (!nearest || nearest.contourId !== contourId) {
      return;
    }

    const sourceSegment = drawingEditor.scene.segments.find(
      (segment) =>
        segment.contourId === contourId &&
        (segment.from.id === pointId || segment.to.id === pointId),
    );
    const targetSegment = drawingEditor.scene.segments.find(
      (segment) =>
        segment.contourId === nearest.contourId &&
        segment.segment.id !== sourceSegment?.segment.id &&
        (segment.from.id === nearest.point.id || segment.to.id === nearest.point.id),
    );

    if (isDimensionLockEnabled) {
      if (!sourceSegment) {
        return;
      }

      const movingPoint = sourceSegment.from.id === pointId ? sourceSegment.from : sourceSegment.to;
      const deltaX = nearest.point.x - movingPoint.x;
      const deltaY = nearest.point.y - movingPoint.y;

      drawingEditor.moveSegmentByDelta(
        { contourId: sourceSegment.contourId, segmentId: sourceSegment.segment.id },
        deltaX,
        deltaY,
      );
      drawingEditor.connectLinesIfCoincident([
        { contourId, pointId },
        { contourId: nearest.contourId, pointId: nearest.point.id },
      ]);
    } else {
      drawingEditor.connectLines([
        { contourId, pointId },
        { contourId: nearest.contourId, pointId: nearest.point.id },
      ]);
    }

    if (sourceSegment && targetSegment) {
      const connectedKeys = [
        `${sourceSegment.contourId}:${sourceSegment.segment.id}`,
        `${targetSegment.contourId}:${targetSegment.segment.id}`,
      ];
      setConnectedSegmentKeys(connectedKeys);
      window.setTimeout(() => {
        setConnectedSegmentKeys((current) =>
          current.every((key) => connectedKeys.includes(key)) ? [] : current,
        );
      }, CONNECTED_HIGHLIGHT_MS);
    }
  };

  const handleSegmentSelect = (contourId: string, segmentId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      selectionApi.toggleSegment(contourId, segmentId);
      return;
    }

    const alreadySelected = selectionApi.selectedSegments.some(
      (segment) => segment.contourId === contourId && segment.segmentId === segmentId,
    );
    if (alreadySelected && selectionApi.selectedSegments.length > 1) {
      return;
    }

    selectionApi.selectSegmentExclusive(contourId, segmentId);
  };

  const handleSelectionBoxSelect = (
    hitSegments: Array<{ contourId: string; segmentId: string }>,
    append: boolean,
  ) => {
    if (!append) {
      selectionApi.setSegmentsExclusive(
        hitSegments.map((segment) => ({
          kind: 'segment' as const,
          contourId: segment.contourId,
          segmentId: segment.segmentId,
        })),
      );
      return;
    }

    const merged = new Map<string, { contourId: string; segmentId: string }>();
    for (const segment of selectionApi.selectedSegments) {
      merged.set(`${segment.contourId}:${segment.segmentId}`, {
        contourId: segment.contourId,
        segmentId: segment.segmentId,
      });
    }
    for (const segment of hitSegments) {
      merged.set(`${segment.contourId}:${segment.segmentId}`, segment);
    }

    selectionApi.setSegmentsExclusive(
      [...merged.values()].map((segment) => ({
        kind: 'segment' as const,
        contourId: segment.contourId,
        segmentId: segment.segmentId,
      })),
    );
  };

  const handleSegmentMoveByDelta = (
    contourId: string,
    segmentId: string,
    deltaX: number,
    deltaY: number,
  ) => {
    if (isDimensionLockEnabled) {
      const connectedRefs = collectConnectedSegmentRefs(contourId, segmentId);
      if (connectedRefs.length > 1) {
        drawingEditor.moveSegmentsByDelta(connectedRefs, deltaX, deltaY);
        return;
      }
    }

    const selectedRefs = selectionApi.selectedSegments.map((segment) => ({
      contourId: segment.contourId,
      segmentId: segment.segmentId,
    }));
    const isDraggedSelected = selectedRefs.some(
      (segment) => segment.contourId === contourId && segment.segmentId === segmentId,
    );

    const segment = drawingEditor.scene.segments.find(
      (item) => item.contourId === contourId && item.segment.id === segmentId,
    );
    if (segment) {
      const projected = [
        { pointId: segment.from.id, x: segment.from.x + deltaX, y: segment.from.y + deltaY },
        { pointId: segment.to.id, x: segment.to.x + deltaX, y: segment.to.y + deltaY },
      ];
      setConnectedSegmentKeys(findConnectedHighlightForSegment(contourId, segmentId, projected));
    }

    if (selectedRefs.length > 1 && isDraggedSelected) {
      drawingEditor.moveSegmentsByDelta(selectedRefs, deltaX, deltaY);
      return;
    }

    drawingEditor.moveSegmentByDelta({ contourId, segmentId }, deltaX, deltaY);
  };

  const handleSegmentDragEnd = (contourId: string, segmentId: string) => {
    const selectedRefs = selectionApi.selectedSegments.map((segmentItem) => ({
      contourId: segmentItem.contourId,
      segmentId: segmentItem.segmentId,
    }));
    const segment = drawingEditor.scene.segments.find((item) => item.contourId === contourId && item.segment.id === segmentId);
    if (!segment) {
      return;
    }

    const segmentEndpoints = [segment.from, segment.to];
    const connectedKeys = new Set<string>();
    const targets =
      selectedRefs.length > 1 &&
      selectedRefs.some((ref) => ref.contourId === contourId && ref.segmentId === segmentId)
        ? selectedRefs
        : [{ contourId, segmentId }];

    for (const ref of targets) {
      for (const key of findConnectedHighlightForSegment(ref.contourId, ref.segmentId)) {
        connectedKeys.add(key);
      }
    }

    if (isDimensionLockEnabled) {
      let best:
        | {
            endpointId: string;
            endpointX: number;
            endpointY: number;
            nearestPointId: string;
            nearestX: number;
            nearestY: number;
            distance: number;
          }
        | null = null;

      for (const endpoint of segmentEndpoints) {
        const nearest = drawingEditor.scene.points.find((item) => {
          if (item.contourId !== contourId) {
            return false;
          }

          if (item.point.id === endpoint.id) {
            return false;
          }

          const distance = Math.hypot(item.point.x - endpoint.x, item.point.y - endpoint.y);
          return distance <= SNAP_DISTANCE;
        });

        if (!nearest) {
          continue;
        }

        const distance = Math.hypot(nearest.point.x - endpoint.x, nearest.point.y - endpoint.y);
        if (!best || distance < best.distance) {
          best = {
            endpointId: endpoint.id,
            endpointX: endpoint.x,
            endpointY: endpoint.y,
            nearestPointId: nearest.point.id,
            nearestX: nearest.point.x,
            nearestY: nearest.point.y,
            distance,
          };
        }
      }

      if (!best) {
        setConnectedSegmentKeys([]);
        return;
      }

      const connectedRefs = collectConnectedSegmentRefs(contourId, segmentId);
      const movedRefs =
        connectedRefs.length > 1
          ? connectedRefs
          : selectedRefs.length > 1 &&
              selectedRefs.some((ref) => ref.contourId === contourId && ref.segmentId === segmentId)
            ? selectedRefs
            : [{ contourId, segmentId }];

      const deltaX = best.nearestX - best.endpointX;
      const deltaY = best.nearestY - best.endpointY;
      drawingEditor.moveSegmentsByDelta(movedRefs, deltaX, deltaY);
      drawingEditor.connectLinesIfCoincident([
        { contourId, pointId: best.endpointId },
        { contourId, pointId: best.nearestPointId },
      ]);

      const lockHighlight = findConnectedHighlightForSegment(contourId, segmentId);
      if (lockHighlight.length > 0) {
        setConnectedSegmentKeys(lockHighlight);
        window.setTimeout(() => {
          setConnectedSegmentKeys((current) =>
            current.every((key) => lockHighlight.includes(key)) ? [] : current,
          );
        }, CONNECTED_HIGHLIGHT_MS);
      } else {
        setConnectedSegmentKeys([]);
      }
      return;
    }

    for (const endpoint of segmentEndpoints) {
      const nearest = drawingEditor.scene.points.find((item) => {
        if (item.contourId !== contourId) {
          return false;
        }

        if (item.point.id === endpoint.id) {
          return false;
        }

        const distance = Math.hypot(item.point.x - endpoint.x, item.point.y - endpoint.y);
        return distance <= SNAP_DISTANCE;
      });

      if (!nearest) {
        continue;
      }

      drawingEditor.snapSegmentEndpointAndConnect(
        { contourId, segmentId },
        endpoint.id,
        { contourId: nearest.contourId, pointId: nearest.point.id },
      );

    }

    if (connectedKeys.size > 0) {
      const highlight = [...connectedKeys];
      setConnectedSegmentKeys(highlight);
      window.setTimeout(() => {
        setConnectedSegmentKeys((current) =>
          current.every((key) => highlight.includes(key)) ? [] : current,
        );
      }, CONNECTED_HIGHLIGHT_MS);
      return;
    }

    setConnectedSegmentKeys([]);
  };

  const handleDeleteSelectedSegment = () => {
    if (selectionApi.selectedSegments.length === 0) {
      return;
    }

    for (const segment of selectionApi.selectedSegments) {
      drawingEditor.deleteSegment(segment);
    }
    selectionApi.clear();
  };

  const handleDisconnectSelectedSegments = () => {
    if (selectionApi.selectedSegments.length < 2) {
      return;
    }

    const refs = selectionApi.selectedSegments.map((segment) => ({
        contourId: segment.contourId,
        segmentId: segment.segmentId,
      }));

    let disconnected = false;
    for (let i = 0; i < refs.length; i += 1) {
      for (let j = i + 1; j < refs.length; j += 1) {
        const first = refs[i];
        const second = refs[j];
        if (!first || !second) {
          continue;
        }
        if (first.contourId !== second.contourId) {
          continue;
        }

        drawingEditor.disconnectSegments([first, second]);
        disconnected = true;
        break;
      }
      if (disconnected) {
        break;
      }
    }

    if (!disconnected) {
      setSyncMessage(t('editor.sync.errors.disconnectPairNotFound'));
      return;
    }

    selectionApi.clear();
  };

  const duplicateAndSelect = (
    sourceSegments: Array<{ contourId: string; segmentId: string }>,
    offsetMultiplier: number = 1,
  ) => {
    if (sourceSegments.length === 0) {
      return;
    }

    const created = drawingEditor.duplicateSegments(
      sourceSegments,
      24 * offsetMultiplier,
      24 * offsetMultiplier,
    );

    if (created.length === 0) {
      return;
    }

    selectionApi.setSegmentsExclusive(
      created.map((segment) => ({
        kind: 'segment' as const,
        contourId: segment.contourId,
        segmentId: segment.segmentId,
      })),
    );
  };

  useEffect(() => {
    if (screenMode !== 'editor') {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const targetTag = target?.tagName?.toLowerCase();
      const isTypingTarget =
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const code = event.code;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleDeleteSelectedSegment();
        return;
      }

      if (mod && code === 'KeyC') {
        event.preventDefault();
        const selected = selectionApi.selectedSegments.map((segment) => ({
          contourId: segment.contourId,
          segmentId: segment.segmentId,
        }));
        if (selected.length > 0) {
          setClipboardSegments(selected);
          setPasteCounter(1);
        }
        return;
      }

      if (mod && code === 'KeyV') {
        event.preventDefault();
        if (clipboardSegments.length === 0) {
          return;
        }
        duplicateAndSelect(clipboardSegments, pasteCounter);
        setPasteCounter((current) => current + 1);
        return;
      }

      if (mod && code === 'KeyD') {
        event.preventDefault();
        const selected = selectionApi.selectedSegments.map((segment) => ({
          contourId: segment.contourId,
          segmentId: segment.segmentId,
        }));
        duplicateAndSelect(selected, 1);
        return;
      }

      if (mod && event.shiftKey && code === 'KeyG') {
        event.preventDefault();
        handleDisconnectSelectedSegments();
        return;
      }

      if (mod && event.shiftKey && code === 'KeyD') {
        event.preventDefault();
        handleDisconnectSelectedSegments();
        return;
      }

      if (mod && key === 'z') {
        event.preventDefault();
        drawingEditor.undo();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [
    clipboardSegments,
    drawingEditor,
    handleDeleteSelectedSegment,
    handleDisconnectSelectedSegments,
    pasteCounter,
    screenMode,
    selectionApi,
  ]);

  if (screenMode === 'list') {
    return (
      <div className="drawings-home">
        <header className="drawings-home__header">
          <div>
            <h1>{t('home.title')}</h1>
            <p>{t('home.subtitle')}</p>
          </div>
          <div className="drawings-home__header-actions">
            <button type="button" onClick={openCreateModal}>
              {t('home.create.openAction')}
            </button>
            <LanguageSwitcher />
          </div>
        </header>

        <main className="drawings-home__content">
          {isListLoading ? <p>{t('home.loading')}</p> : null}

          {!isListLoading && drawings.length === 0 ? (
            <div className="drawings-home__empty">
              <p>{t('home.emptyTitle')}</p>
              <p>{t('home.emptyDescription')}</p>
              <button type="button" onClick={openCreateModal}>
                {t('home.create.openAction')}
              </button>
            </div>
          ) : null}

          {!isListLoading && drawings.length > 0 ? (
            <div className="drawings-home__list">
              {drawings.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="drawings-home__list-item"
                  onClick={() => void openDrawingById(item.id)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.status}</span>
                </button>
              ))}
            </div>
          ) : null}

          {syncMessage ? <div className="drawings-home__message">{syncMessage}</div> : null}
        </main>

        {isCreateModalOpen ? (
          <div className="editor-modal" role="dialog" aria-modal="true">
            <div className="editor-modal__card">
              {createModalMode === 'choice' ? (
                <>
                  <h2>{t('home.create.modalTitle')}</h2>
                  <p>{t('home.create.modalDescription')}</p>
                  <div className="editor-modal__actions">
                    <button type="button" onClick={() => void handleCreateBlankDrawing()}>
                      {t('home.create.blankAction')}
                    </button>
                    <button type="button" onClick={() => setCreateModalMode('ai-upload')}>
                      {t('home.create.aiAction')}
                    </button>
                    <button type="button" onClick={closeCreateModal}>
                      {t('home.create.cancelAction')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>{t('home.create.ai.title')}</h2>
                  <p>{t('home.create.ai.description')}</p>
                  <div className="editor-modal__instructions">
                    <p>{t('home.create.ai.instructions.title')}</p>
                    <ul>
                      <li>{t('home.create.ai.instructions.item1')}</li>
                      <li>{t('home.create.ai.instructions.item2')}</li>
                      <li>{t('home.create.ai.instructions.item3')}</li>
                    </ul>
                  </div>

                  <label className="editor-modal__file-input">
                    <span>{t('home.create.ai.fileLabel')}</span>
                    <input type="file" accept="image/*" onChange={handleAiFileChange} />
                  </label>

                  {createPhotoFile ? (
                    <p>{t('home.create.ai.selectedFile', { name: createPhotoFile.name })}</p>
                  ) : (
                    <p>{t('home.create.ai.noFile')}</p>
                  )}

                  <div className="editor-modal__status">
                    <span>{t(`home.create.ai.status.${aiFlowStatus}`)}</span>
                    {aiFlowMessage ? <span>{aiFlowMessage}</span> : null}
                  </div>

                  <div className="editor-modal__actions">
                    <button type="button" onClick={() => void handleCreateFromPhoto()} disabled={isAiFlowRunning}>
                      {isAiFlowRunning
                        ? t('home.create.ai.startActionRunning')
                        : t('home.create.ai.startAction')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isAiFlowRunning) {
                          return;
                        }
                        setCreateModalMode('choice');
                        setAiFlowStatus('idle');
                        setAiFlowMessage('');
                      }}
                      disabled={isAiFlowRunning}
                    >
                      {t('home.create.ai.backAction')}
                    </button>
                    <button type="button" onClick={closeCreateModal} disabled={isAiFlowRunning}>
                      {t('home.create.cancelAction')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="editor-workspace">
      <header className="editor-topbar">
        <div className="editor-topbar__group">
          <button type="button" onClick={() => setScreenMode('list')}>
            {t('editor.top.backToList')}
          </button>
          <button type="button" onClick={() => void handleSaveDrawing()} disabled={isSavingDrawing}>
            {isSavingDrawing ? t('editor.top.savingAction') : t('editor.top.saveAction')}
          </button>
          <button
            type="button"
            className={isDimensionLockEnabled ? 'is-active' : ''}
            onClick={() => setIsDimensionLockEnabled((current) => !current)}
          >
            {t('editor.top.dimensionLockAction')}
          </button>
        </div>

        <div className="editor-topbar__group">
          <label className="editor-inline-field">
            <span>{t('editor.top.titleLabel')}</span>
            <input
              value={drawingTitle}
              onChange={(event) => setDrawingTitle(event.target.value)}
              placeholder={t('editor.top.titlePlaceholder')}
            />
          </label>
          <LanguageSwitcher />
        </div>

        <div className={warningCount > 0 ? 'editor-warning-pill is-alert' : 'editor-warning-pill'}>
          {warningCount > 0
            ? t('editor.top.warningAlert', { count: warningCount })
            : t('editor.top.warningOk')}
        </div>
      </header>

      <section className="editor-subbar">
        <div className="editor-subbar__group">
          <span>{selectedLabel}</span>
          <button
            type="button"
            onClick={handleDeleteSelectedSegment}
            disabled={selectionApi.selectedSegments.length === 0}
          >
            {t('editor.top.deleteAction')}
          </button>
          <button
            type="button"
            onClick={handleDisconnectSelectedSegments}
            disabled={selectionApi.selectedSegments.length < 2}
          >
            {t('editor.top.disconnectAction')}
          </button>
          <button type="button" className="icon-button" onClick={drawingEditor.undo} disabled={!drawingEditor.canUndo}>
            {t('editor.subbar.undoIcon')}
          </button>
          <button type="button" className="icon-button" disabled>
            {t('editor.subbar.redoIcon')}
          </button>
        </div>

        <div className="editor-subbar__group">
          <span>{t('editor.subbar.dimensionLabel')}</span>
          <input
            value={segmentLengthInput}
            onChange={handleLengthChange}
            disabled={
              !selectedSegmentMetrics ||
              selectedSegmentMetrics.isConnectedToOtherSegments ||
              isDimensionLockEnabled
            }
            placeholder={t('editor.subbar.dimensionPlaceholder')}
          />
          <span>{t('editor.subbar.angleLabel')}</span>
          <input
            value={segmentAngleInput}
            onChange={handleAngleChange}
            disabled={!selectedSegmentMetrics || selectedSegmentMetrics.isConnectedToOtherSegments}
            placeholder={t('editor.subbar.anglePlaceholder')}
          />
          {selectedSegmentMetrics?.isConnectedToOtherSegments ? (
            <span>{t('editor.subbar.connectedSegmentReadOnly')}</span>
          ) : null}
        </div>
      </section>

      <div className="editor-main">
        <aside className="editor-leftbar">
          <h3>{t('editor.left.segmentsTitle')}</h3>
          <div className="editor-module-card">
            <p>{t('editor.left.geometryModuleTitle')}</p>
            <button type="button" onClick={handleAddLineWithPrompt}>
              {t('editor.left.addDefaultLineAction')}
            </button>
            <button type="button" onClick={handleAddRectangleWithPrompt}>
              {t('editor.left.addRectangleAction')}
            </button>
          </div>
          <p>{syncMessage || t('editor.left.idleMessage')}</p>
        </aside>

        <main className="editor-canvas-area">
          <ViewportCanvas
            t={t}
            viewport={navigation.viewport}
            grid={navigation.grid}
            scene={drawingEditor.scene}
            dimensionLabels={drawingEditor.dimensionLabels}
            geometryWarnings={drawingEditor.geometryWarnings}
            selection={selectionApi.selection}
            connectedSegmentKeys={connectedSegmentKeys}
            onPointSelect={handlePointSelect}
            onPointMove={(contourId, pointId, x, y) => {
              if (isDimensionLockEnabled) {
                const connectedSegments = drawingEditor.scene.segments.filter(
                  (segment) =>
                    segment.contourId === contourId &&
                    (segment.from.id === pointId || segment.to.id === pointId),
                );

                if (connectedSegments.length > 1) {
                  return;
                }

                const selectedLockSegment = selectionApi.selectedSegment
                  ? {
                      contourId: selectionApi.selectedSegment.contourId,
                      segmentId: selectionApi.selectedSegment.segmentId,
                    }
                  : null;
                const fallbackLockSegment = connectedSegments[0];
                const lockSegment = selectedLockSegment ?? (
                  fallbackLockSegment
                    ? {
                        contourId: fallbackLockSegment.contourId,
                        segmentId: fallbackLockSegment.segment.id,
                      }
                    : null
                );

                if (lockSegment) {
                  drawingEditor.movePointWithLockedSegmentLength(
                    { contourId, pointId },
                    lockSegment,
                    x,
                    y,
                  );
                  return;
                }
              }

              drawingEditor.movePoint({ contourId, pointId }, x, y);
            }}
            onPointDragEnd={handlePointDragEnd}
            onSegmentSelect={handleSegmentSelect}
            onSegmentMoveByDelta={handleSegmentMoveByDelta}
            onSegmentDragEnd={handleSegmentDragEnd}
            onSelectionBoxSelect={handleSelectionBoxSelect}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={navigation.onPointerMove}
            onPointerUp={navigation.onPointerUp}
            onPointerLeave={navigation.onPointerLeave}
            onWheel={navigation.onWheel}
          />
        </main>
      </div>

      <footer className="editor-bottombar">
        <div className="editor-bottombar__group">
          <button type="button" onClick={navigation.zoomOut}>
            {t('editor.bottom.zoomOut')}
          </button>
          <span>{t('editor.bottom.zoomValue', { value: navigation.viewport.zoom.toFixed(2) })}</span>
          <button type="button" onClick={navigation.zoomIn}>
            {t('editor.bottom.zoomIn')}
          </button>
          <button type="button" onClick={navigation.reset}>
            {t('editor.bottom.reset')}
          </button>
        </div>

        <div className="editor-bottombar__group">
          <span>{t('editor.bottom.contours', { count: drawingEditor.scene.contours.length })}</span>
          <span>{t('editor.bottom.warnings', { count: warningCount })}</span>
        </div>
      </footer>
    </div>
  );
}

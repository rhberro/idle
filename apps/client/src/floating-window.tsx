import {
	FloatingPanel,
	IconButton,
	Portal,
	useFloatingPanelContext,
} from "@chakra-ui/react";
import type { ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export type FloatingWindowPosition = { x: number; y: number };
export type FloatingWindowSize = { width: number; height: number };
export type FloatingWindowStage = "default" | "minimized" | "maximized";

export type FloatingWindowProps = {
	title: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	position: FloatingWindowPosition;
	onPositionChange: (position: FloatingWindowPosition) => void;
	onPositionChangeEnd?: (position: FloatingWindowPosition) => void;
	size: FloatingWindowSize;
	onSizeChange: (size: FloatingWindowSize) => void;
	onSizeChangeEnd?: (size: FloatingWindowSize) => void;
	onStageChange?: (stage: FloatingWindowStage) => void;
	// One-time seed applied imperatively on mount (see StageInitializer below) —
	// stage has no controlled-prop equivalent in Ark's API, so this cannot be
	// kept in sync on every render like position/size are.
	initialStage?: FloatingWindowStage;
	minSize: FloatingWindowSize;
	maxSize?: FloatingWindowSize;
	titleBarControls?: ReactNode;
	children: ReactNode;
};

export const FLOATING_WINDOW_BACKGROUND_COLOR = "#171717";
export const FLOATING_WINDOW_BORDER = "1px solid #262626";
export const FLOATING_WINDOW_TEXT_COLOR = "#f5f5f5";
const HEADER_TEXT_COLOR = "#a3a3a3";
export const FLOATING_WINDOW_CONTROL_BUTTON_SIZE = "2xs";
export const FLOATING_WINDOW_CONTROL_BUTTON_VARIANT = "ghost";

type IconGlyphProps = {
	label: string;
	strokeLinecap?: "round";
	strokeLinejoin?: "round";
	children: ReactNode;
};

function IconGlyph(props: IconGlyphProps) {
	const { label, strokeLinecap, strokeLinejoin, children } = props;
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap={strokeLinecap}
			strokeLinejoin={strokeLinejoin}
			aria-hidden="true"
		>
			<title>{label}</title>
			{children}
		</svg>
	);
}

function GripIcon() {
	return (
		<IconGlyph label="Drag" strokeLinecap="round">
			<line x1="4" y1="8" x2="20" y2="8" />
			<line x1="4" y1="16" x2="20" y2="16" />
		</IconGlyph>
	);
}

function MinimizeIcon() {
	return (
		<IconGlyph label="Minimize" strokeLinecap="round">
			<line x1="5" y1="19" x2="19" y2="19" />
		</IconGlyph>
	);
}

function MaximizeIcon() {
	return (
		<IconGlyph label="Maximize" strokeLinejoin="round">
			<rect x="5" y="5" width="14" height="14" rx="1" />
		</IconGlyph>
	);
}

function RestoreIcon() {
	return (
		<IconGlyph label="Restore" strokeLinejoin="round">
			<rect x="7" y="7" width="12" height="12" rx="1" />
			<path d="M7 17H5V5h12v2" />
		</IconGlyph>
	);
}

function CloseIcon() {
	return (
		<IconGlyph label="Close" strokeLinecap="round">
			<line x1="6" y1="6" x2="18" y2="18" />
			<line x1="6" y1="18" x2="18" y2="6" />
		</IconGlyph>
	);
}

type SizeRestorerProps = {
	pendingRestoreSize: RefObject<FloatingWindowSize | undefined>;
};

// The panel keeps its last manually-resized ("default"-stage) size in
// `pendingRestoreSize` only for the case where it was closed while minimized
// or maximized: closing always resets the panel's internal stage back to
// "default", but (with persistRect) leaves its size at whatever the
// minimized/maximized stage had last set it to. Without this fix, reopening
// would show a "default"-stage panel squeezed into a minimized sliver, or
// stuck at maximized dimensions, instead of the size the player last manually
// resized it to.
function SizeRestorer(props: SizeRestorerProps) {
	const { pendingRestoreSize } = props;
	const panel = useFloatingPanelContext();

	function restorePendingSize() {
		if (!panel.open || pendingRestoreSize.current === undefined) {
			return;
		}
		panel.setSize(pendingRestoreSize.current);
		pendingRestoreSize.current = undefined;
	}

	useEffect(restorePendingSize, [panel.open]);

	return undefined;
}

type StageInitializerProps = {
	initialStage: FloatingWindowStage;
};

// Drives the panel into a persisted non-"default" stage exactly once on
// mount, via Ark's imperative minimize()/maximize() — the only way to seed a
// stage the panel doesn't accept as a controlled prop (see the comment on
// FloatingWindowProps["initialStage"]).
function StageInitializer(props: StageInitializerProps) {
	const { initialStage } = props;
	const panel = useFloatingPanelContext();
	const hasAppliedInitialStageRef = useRef(false);

	function applyInitialStage() {
		if (hasAppliedInitialStageRef.current) {
			return;
		}
		hasAppliedInitialStageRef.current = true;
		if (initialStage === "minimized") {
			panel.minimize();
		} else if (initialStage === "maximized") {
			panel.maximize();
		}
	}

	useEffect(applyInitialStage, []);

	return undefined;
}

export function FloatingWindow(props: FloatingWindowProps) {
	const {
		title,
		open,
		onOpenChange,
		position,
		onPositionChange,
		onPositionChangeEnd,
		size,
		onSizeChange,
		onSizeChangeEnd,
		onStageChange,
		initialStage,
		minSize,
		maxSize,
		titleBarControls,
		children,
	} = props;

	const [stage, setStage] = useState<FloatingWindowStage>("default");
	const stageRef = useRef<FloatingWindowStage>("default");
	const fullSizeRef = useRef<FloatingWindowSize>(size);
	const pendingRestoreSizeRef = useRef<FloatingWindowSize | undefined>(
		undefined,
	);

	function handleOpenChange(details: FloatingPanel.OpenChangeDetails) {
		if (!details.open && stageRef.current !== "default") {
			pendingRestoreSizeRef.current = fullSizeRef.current;
		}
		onOpenChange(details.open);
	}

	function handlePositionChange(details: FloatingPanel.PositionChangeDetails) {
		onPositionChange(details.position);
	}

	function handlePositionChangeEnd(
		details: FloatingPanel.PositionChangeDetails,
	) {
		onPositionChangeEnd?.(details.position);
	}

	function handleSizeChange(details: FloatingPanel.SizeChangeDetails) {
		if (stageRef.current === "default") {
			fullSizeRef.current = details.size;
		}
		onSizeChange(details.size);
	}

	function handleSizeChangeEnd(details: FloatingPanel.SizeChangeDetails) {
		onSizeChangeEnd?.(details.size);
	}

	function handleStageChange(details: FloatingPanel.StageChangeDetails) {
		stageRef.current = details.stage;
		setStage(details.stage);
		onStageChange?.(details.stage);
	}

	const isMinimized = stage === "minimized";
	const isMaximized = stage === "maximized";

	const restoreLabel = `Restore ${title}`;
	const minimizeLabel = `Minimize ${title}`;
	const maximizeLabel = `Maximize ${title}`;
	const closeLabel = `Close ${title}`;

	const minimizeControl = isMinimized ? (
		<FloatingPanel.StageTrigger stage="default" asChild>
			<IconButton
				aria-label={restoreLabel}
				size={FLOATING_WINDOW_CONTROL_BUTTON_SIZE}
				variant={FLOATING_WINDOW_CONTROL_BUTTON_VARIANT}
			>
				<RestoreIcon />
			</IconButton>
		</FloatingPanel.StageTrigger>
	) : (
		<FloatingPanel.StageTrigger stage="minimized" asChild>
			<IconButton
				aria-label={minimizeLabel}
				size={FLOATING_WINDOW_CONTROL_BUTTON_SIZE}
				variant={FLOATING_WINDOW_CONTROL_BUTTON_VARIANT}
			>
				<MinimizeIcon />
			</IconButton>
		</FloatingPanel.StageTrigger>
	);

	const maximizeControl = isMaximized ? (
		<FloatingPanel.StageTrigger stage="default" asChild>
			<IconButton
				aria-label={restoreLabel}
				size={FLOATING_WINDOW_CONTROL_BUTTON_SIZE}
				variant={FLOATING_WINDOW_CONTROL_BUTTON_VARIANT}
			>
				<RestoreIcon />
			</IconButton>
		</FloatingPanel.StageTrigger>
	) : (
		<FloatingPanel.StageTrigger stage="maximized" asChild>
			<IconButton
				aria-label={maximizeLabel}
				size={FLOATING_WINDOW_CONTROL_BUTTON_SIZE}
				variant={FLOATING_WINDOW_CONTROL_BUTTON_VARIANT}
			>
				<MaximizeIcon />
			</IconButton>
		</FloatingPanel.StageTrigger>
	);

	const stageInitializer =
		initialStage === undefined || initialStage === "default" ? undefined : (
			<StageInitializer initialStage={initialStage} />
		);

	return (
		<FloatingPanel.Root
			open={open}
			onOpenChange={handleOpenChange}
			position={position}
			onPositionChange={handlePositionChange}
			onPositionChangeEnd={handlePositionChangeEnd}
			size={size}
			onSizeChange={handleSizeChange}
			onSizeChangeEnd={handleSizeChangeEnd}
			onStageChange={handleStageChange}
			minSize={minSize}
			maxSize={maxSize}
			persistRect
			allowOverflow={false}
		>
			<Portal>
				<FloatingPanel.Positioner>
					<FloatingPanel.Content
						bg={FLOATING_WINDOW_BACKGROUND_COLOR}
						border={FLOATING_WINDOW_BORDER}
						borderRadius="4px"
						color={FLOATING_WINDOW_TEXT_COLOR}
						overflow="hidden"
					>
						<SizeRestorer pendingRestoreSize={pendingRestoreSizeRef} />
						{stageInitializer}
						<FloatingPanel.Header
							borderBottom={FLOATING_WINDOW_BORDER}
							px={2}
							py={1}
						>
							<FloatingPanel.DragTrigger
								display="flex"
								alignItems="center"
								gap={2}
								color={HEADER_TEXT_COLOR}
							>
								<GripIcon />
								<FloatingPanel.Title fontSize="sm" fontWeight="medium">
									{title}
								</FloatingPanel.Title>
							</FloatingPanel.DragTrigger>
							<FloatingPanel.Control>
								{titleBarControls}
								{minimizeControl}
								{maximizeControl}
								<FloatingPanel.CloseTrigger asChild>
									<IconButton
										aria-label={closeLabel}
										size={FLOATING_WINDOW_CONTROL_BUTTON_SIZE}
										variant={FLOATING_WINDOW_CONTROL_BUTTON_VARIANT}
									>
										<CloseIcon />
									</IconButton>
								</FloatingPanel.CloseTrigger>
							</FloatingPanel.Control>
						</FloatingPanel.Header>
						<FloatingPanel.Body
							display="flex"
							flexDirection="column"
							p={0}
							overflow="hidden"
						>
							{children}
						</FloatingPanel.Body>
						<FloatingPanel.ResizeTriggers />
					</FloatingPanel.Content>
				</FloatingPanel.Positioner>
			</Portal>
		</FloatingPanel.Root>
	);
}

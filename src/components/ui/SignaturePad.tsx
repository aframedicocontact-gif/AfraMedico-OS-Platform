import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "./button";

type StrokePoint = { x: number; y: number; t: number };
type Strokes = StrokePoint[][];

// Logical coordinate space every captured point is normalized into,
// regardless of on-screen canvas size or device pixel ratio. Must stay in
// sync with SIGNATURE_BOX in supabase/functions/_shared/partnerAgreementPdf.ts
// so the server-side PDF renderer scales strokes deterministically.
export const SIGNATURE_BOX = { width: 600, height: 200 };

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  clear: () => void;
  getStrokes: () => Strokes;
}

type Props = { label?: string; className?: string; onChange?: (isEmpty: boolean) => void };

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { label = "Signature", className, onChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Strokes>([]);
  const drawingRef = useRef(false);
  const [isEmptyState, setIsEmptyState] = useState(true);

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const widthCss = canvas.width / dpr;
    const heightCss = canvas.height / dpr;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, widthCss, heightCss);
    const scaleX = widthCss / SIGNATURE_BOX.width;
    const scaleY = heightCss / SIGNATURE_BOX.height;
    ctx.strokeStyle = "#0f172a";
    ctx.fillStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.length === 1) {
        const p = stroke[0];
        ctx.beginPath();
        ctx.arc(p.x * scaleX, p.y * scaleY, 1.2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * scaleX, stroke[0].y * scaleY);
      for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i].x * scaleX, stroke[i].y * scaleY);
      ctx.stroke();
    }
    ctx.restore();
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    redraw();
  }

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toLogicalPoint(event: ReactPointerEvent<HTMLCanvasElement>): StrokePoint {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * SIGNATURE_BOX.width;
    const y = ((event.clientY - rect.top) / rect.height) * SIGNATURE_BOX.height;
    return {
      x: Math.min(Math.max(x, 0), SIGNATURE_BOX.width),
      y: Math.min(Math.max(y, 0), SIGNATURE_BOX.height),
      t: Date.now(),
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    canvasRef.current?.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokesRef.current = [...strokesRef.current, [toLogicalPoint(event)]];
    setIsEmptyState(false);
    onChange?.(false);
    redraw();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    event.preventDefault();
    strokesRef.current[strokesRef.current.length - 1].push(toLogicalPoint(event));
    redraw();
  }

  function endStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* pointer capture may already be released */
    }
  }

  function clear() {
    strokesRef.current = [];
    setIsEmptyState(true);
    onChange?.(true);
    redraw();
  }

  useImperativeHandle(ref, () => ({
    isEmpty: () => strokesRef.current.length === 0,
    clear,
    getStrokes: () => strokesRef.current.map((stroke) => stroke.map((point) => ({ ...point }))),
  }));

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`${label} pad. Draw your signature using a mouse, touch, or stylus in the box below.`}
        className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-input bg-white"
        style={{ aspectRatio: `${SIGNATURE_BOX.width} / ${SIGNATURE_BOX.height}` }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isEmptyState ? "Draw your signature above (mouse, touch, or stylus)." : "Signature captured."}
        </p>
        <Button type="button" variant="secondary" className="h-7 px-2 text-xs" onClick={clear}>
          Clear Signature
        </Button>
      </div>
    </div>
  );
});

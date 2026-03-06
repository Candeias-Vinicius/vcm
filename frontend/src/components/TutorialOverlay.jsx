import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTutorial, TUTORIAL_STEPS } from '../context/TutorialContext';

export default function TutorialOverlay() {
  const { active, step, currentStepDef, nextStep, prevStep, skipTutorial, isLastStep } = useTutorial();
  const [tooltipStyle, setTooltipStyle] = useState({ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: 70, maxWidth: '340px', width: '90vw' });
  const [highlightStyle, setHighlightStyle] = useState(null);
  const prevTargetRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!active || !currentStepDef) return;

    // Remove highlight from previous element
    if (prevTargetRef.current) {
      prevTargetRef.current.classList.remove(
        'tutorial-highlight', 'relative', 'z-[60]', 'rounded-lg',
        'ring-2', 'ring-valorant-red', 'ring-offset-2', 'ring-offset-valorant-dark'
      );
      prevTargetRef.current = null;
    }

    if (!currentStepDef.target) {
      setHighlightStyle(null);
      setTooltipStyle({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 70, maxWidth: '340px', width: '90vw' });
      return;
    }

    const el = document.getElementById(currentStepDef.target);
    if (!el) {
      setHighlightStyle(null);
      setTooltipStyle({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 70, maxWidth: '340px', width: '90vw' });
      return;
    }

    // Highlight the target element
    el.classList.add('relative', 'z-[60]', 'ring-2', 'ring-valorant-red', 'ring-offset-2', 'ring-offset-valorant-dark', 'rounded-lg');
    prevTargetRef.current = el;

    // Instant scroll so the element is at a stable position when we measure
    el.scrollIntoView({ behavior: 'instant', block: 'center' });

    // Wait two animation frames for layout to fully settle before measuring
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const pos = currentStepDef.position || 'bottom';
        const margin = 12;
        const tooltipW = Math.min(340, window.innerWidth * 0.9);
        // Measure actual tooltip height; fall back to 200 if not yet in DOM
        const actualH = tooltipRef.current?.offsetHeight || 200;

        let top, left;
        left = rect.left + rect.width / 2 - tooltipW / 2;

        if (pos === 'top') {
          top = rect.top - margin - actualH;
          // Flip to bottom if tooltip would go off the top of the viewport
          if (top < 8) top = rect.bottom + margin;
        } else {
          top = rect.bottom + margin;
          // Flip to top if tooltip would go off the bottom of the viewport
          if (top + actualH > window.innerHeight - 8) top = rect.top - margin - actualH;
        }

        // Final clamp on both axes (safety net)
        left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - actualH - 8));

        setTooltipStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          zIndex: 70,
          width: `${tooltipW}px`,
        });

        setHighlightStyle({
          position: 'fixed',
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          zIndex: 59,
          borderRadius: 10,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          pointerEvents: 'none',
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (prevTargetRef.current) {
        prevTargetRef.current.classList.remove(
          'relative', 'z-[60]', 'ring-2', 'ring-valorant-red',
          'ring-offset-2', 'ring-offset-valorant-dark', 'rounded-lg'
        );
        prevTargetRef.current = null;
      }
    };
  }, [active, step, currentStepDef]);

  if (!active || !currentStepDef) return null;

  return (
    <>
      {/* Backdrop (only when no target element highlight, i.e. centered steps) */}
      {!currentStepDef.target && (
        <div className="fixed inset-0 bg-black/65 z-[55]" />
      )}

      {/* Box-shadow highlight covers the backdrop when target exists */}
      {currentStepDef.target && highlightStyle && (
        <div style={highlightStyle} />
      )}

      {/* Tooltip card */}
      <div ref={tooltipRef} style={tooltipStyle} className="bg-valorant-card border border-valorant-red/60 rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-bold text-base leading-snug">{currentStepDef.title}</h3>
          <button onClick={skipTutorial} className="text-gray-500 hover:text-white flex-shrink-0 mt-0.5" title="Pular tutorial">
            <X size={16} />
          </button>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">{currentStepDef.description}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${i === step ? 'w-4 h-1.5 bg-valorant-red' : 'w-1.5 h-1.5 bg-gray-600'}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={skipTutorial}
            className="text-gray-500 hover:text-gray-300 text-xs underline"
          >
            Pular tutorial
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-valorant-border hover:border-gray-500 transition-colors"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
            )}
            <button
              onClick={nextStep}
              className="flex items-center gap-1 bg-valorant-red hover:bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors"
            >
              {isLastStep ? '🎉 Concluir' : <>Próximo <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

import { motion } from 'framer-motion';

interface TimelinePoint {
  stage: string;
  agent_name: string;
  agent_avatar: string;
  agent_color: string;
  confidence: number;
  timestamp: string;
  summary: string;
}

interface ConfidenceTimelineProps {
  timeline: TimelinePoint[];
}

export default function ConfidenceTimeline({ timeline }: ConfidenceTimelineProps) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="glass-panel p-4 border-brand-primary/20">
      <h3 className="text-sm font-semibold text-gray-400 mb-4">Confidence Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800" />
        
        <div className="space-y-4">
          {timeline.map((point, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-10"
            >
              {/* Timeline dot */}
              <div
                className="absolute left-2.5 top-1 w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: `${point.agent_color}20`,
                  borderColor: point.agent_color,
                }}
              />
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{point.agent_avatar}</span>
                    <span className="text-xs font-medium text-gray-300 truncate">
                      {point.agent_name}
                    </span>
                    <span className="text-[10px] text-gray-600">{point.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{point.summary}</p>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-16 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${point.confidence}%`,
                        backgroundColor: point.agent_color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: point.agent_color }}>
                    {point.confidence}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Final confidence indicator */}
        {timeline.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dark-border flex items-center justify-between">
            <span className="text-xs text-gray-500">Final Confidence</span>
            <span className="text-lg font-bold text-brand-accent">
              {timeline[timeline.length - 1].confidence}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { ThesisTopic, CartItem } from '../types';
import { Plus, Check, Eye, User, Building2, Calendar, Award } from 'lucide-react';

interface TopicCardProps {
  topic: ThesisTopic;
  cart: CartItem[];
  onAddToCart: (topic: ThesisTopic) => void;
  onRemoveFromCart: (topicId: string) => void;
  onViewDetails: (topic: ThesisTopic) => void;
  isMaxReached: boolean;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onViewDetails,
  isMaxReached
}) => {
  const cartItem = cart.find((item) => item.topic.id === topic.id);
  const isInCart = Boolean(cartItem);

  return (
    <div className="academic-card p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
      <div>
        {/* Domain & Code metadata line */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2.5">
          <span className="font-semibold text-[#2563EB] truncate max-w-[70%] font-sans">{topic.domain}</span>
          <span className="font-mono text-slate-400 font-medium shrink-0">{topic.code}</span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(topic)}
          className="text-sm sm:text-base font-heading font-bold text-[#101B35] leading-snug line-clamp-2 hover:text-[#2563EB] cursor-pointer transition-colors"
          title={topic.title}
        >
          {topic.title}
        </h3>

        {/* Abstract snippet */}
        <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed font-sans">
          {topic.abstract}
        </p>

        {/* Context metadata: Director, Lab, Funding */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-sans">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-[#101B35] truncate">{topic.director}</span>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-slate-500">{topic.laboratory}</span>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
            <span className="truncate text-[#0D9488] font-semibold">{topic.funding}</span>
          </div>
        </div>

        {/* Keywords */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 font-sans">
          {topic.keywords.slice(0, 3).map((kw, i) => (
            <React.Fragment key={kw}>
              <span className="text-slate-500">#{kw}</span>
              {i < 2 && <span className="text-slate-300">·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Card Action footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={() => onViewDetails(topic)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#101B35] transition-colors cursor-pointer py-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Fiche détaillée</span>
        </button>

        {isInCart ? (
          <button
            onClick={() => onRemoveFromCart(topic.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-rose-50 hover:text-rose-700 border border-teal-200/80 hover:border-rose-200 rounded-xl transition-colors cursor-pointer group shadow-2xs"
            title="Cliquer pour retirer du panier"
          >
            <Check className="w-3.5 h-3.5 group-hover:hidden text-[#0D9488]" />
            <span className="group-hover:hidden font-medium">Choix n°{cartItem?.priority}</span>
            <span className="hidden group-hover:inline">Retirer du panier</span>
          </button>
        ) : (
          <button
            onClick={() => onAddToCart(topic)}
            disabled={isMaxReached}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isMaxReached
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'academic-btn-primary'
            }`}
            title={isMaxReached ? 'Maximum de 3 sujets déjà atteints dans le panier' : 'Ajouter ce sujet à mes choix provisoires'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter au panier</span>
          </button>
        )}
      </div>
    </div>
  );
};

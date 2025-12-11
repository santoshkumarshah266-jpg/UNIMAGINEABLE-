import * as React from 'react';
import { ColorOption } from '../types';


interface ControlsProps {
    currentColor: ColorOption;
    onColorChange: (color: ColorOption) => void;
    colors: ColorOption[];
}

const Controls: React.FC<ControlsProps> = ({
    currentColor,
    onColorChange,
    colors
}) => {



    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 px-4">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                {/* Colors Only */}
                <div className="flex gap-2 flex-wrap justify-center max-w-md">
                    {colors.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => onColorChange(c)}
                            className={`w-7 h-7 rounded-full transition-all duration-300 relative ${currentColor.name === c.name ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-110'
                                }`}
                            style={{
                                backgroundColor: c.value,
                                boxShadow: currentColor.name === c.name ? `0 0 20px ${c.glow}` : 'none'
                            }}
                            title={c.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Controls;

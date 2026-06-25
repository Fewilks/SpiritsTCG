import React, { useState, useEffect } from 'react';

interface PokemonSpriteProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const getPokemonSpriteUrl = (pokemonName: string): string => {
  if (!pokemonName) return 'https://play.pokemonshowdown.com/sprites/ani/substitute.gif';
  
  let name = pokemonName.toLowerCase().trim();
  
  // Remove suffixes typical of cards
  name = name.replace(/\bex\b/gi, '');
  name = name.replace(/\bvstar\b/gi, '');
  name = name.replace(/\bvmax\b/gi, '');
  name = name.replace(/\bv\b/gi, '');
  name = name.replace(/\bgmax\b/gi, '');
  name = name.replace(/\btera\b/gi, '');
  name = name.replace(/\bprime\b/gi, '');
  name = name.replace(/[^a-z0-9\s-]/g, ''); // remove punctuation
  name = name.trim();
  name = name.replace(/\s+/g, '-'); // replace space with dash

  // Special mappings
  if (name === 'teal-mask-ogerpon') return 'https://play.pokemonshowdown.com/sprites/ani/ogerpon-teal.gif';
  if (name === 'raging-bolt') return 'https://play.pokemonshowdown.com/sprites/ani/ragingbolt.gif';
  if (name === 'iron-valiant') return 'https://play.pokemonshowdown.com/sprites/ani/ironvaliant.gif';
  if (name === 'gholdengo') return 'https://play.pokemonshowdown.com/sprites/ani/gholdengo.gif';
  if (name === 'roaring-moon') return 'https://play.pokemonshowdown.com/sprites/ani/roaringmoon.gif';
  if (name === 'chien-pao') return 'https://play.pokemonshowdown.com/sprites/ani/chienpao.gif';
  if (name === 'dragapult') return 'https://play.pokemonshowdown.com/sprites/ani/dragapult.gif';
  if (name === 'miraidon') return 'https://play.pokemonshowdown.com/sprites/ani/miraidon.gif';
  if (name === 'charizard') return 'https://play.pokemonshowdown.com/sprites/ani/charizard.gif';
  if (name === 'pidgeot') return 'https://play.pokemonshowdown.com/sprites/ani/pidgeot.gif';
  if (name === 'gengar-gmax') return 'https://play.pokemonshowdown.com/sprites/ani/gengar.gif';

  return `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`;
};

export default function PokemonSprite({ name, className = '', size = 'md' }: PokemonSpriteProps) {
  const [src, setSrc] = useState<string>(getPokemonSpriteUrl(name));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSrc(getPokemonSpriteUrl(name));
    setHasError(false);
  }, [name]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const handleImgError = () => {
    if (!hasError) {
      setHasError(true);
      // Try fallback to static official artwork from PokeAPI
      setSrc('https://play.pokemonshowdown.com/sprites/ani/substitute.gif');
    }
  };

  return (
    <div className={`flex items-center justify-center overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}>
      <img
        id={`sprite-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        src={src}
        alt={name}
        className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(139,92,246,0.3)] transition-transform duration-300 hover:scale-115"
        onError={handleImgError}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

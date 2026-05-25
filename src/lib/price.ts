export function parseBRLToCents(mask:string):number{ if(!mask) return 0; const digits = mask.replace(/[^0-9]/g,''); if(!digits) return 0; // último 2 são centavos
  const val = parseInt(digits,10); return isNaN(val)?0: val; }

// Format cents -> BRL (R$ 1.234,56)
export function formatCentsToBRL(cents:number){ const v = (cents/100); return v.toLocaleString('pt-BR',{ style:'currency', currency:'BRL'}); }

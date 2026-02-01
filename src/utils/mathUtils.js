export const round2 = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const sanitizeFloat = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

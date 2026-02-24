const convertISOString = (isoStr) => {
    if (!isoStr) return "";

    const date = new Date(isoStr);

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true // This gives you "PM/AM" instead of 24h
    }).format(date);
}
export default convertISOString;
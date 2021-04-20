

/**
 * Checks if two course offerings have a conflict in day and time.
 * @param {Object} courseA First course offering object
 * @param {Object} courseB Second course offering object
 * @param {Map} invalidCourses List of invalid conflict courses to append to 
 * @returns Boolean indicating if there was a conflict
 */
exports.checkTimeConflict = (courseA, courseB, invalidCourses) => {
    // If empty fields, skip checking
    if (courseA.identifier === courseB.identifier || !courseA.days || !courseB.days ||
        !courseA.startTime || !courseB.startTime || !courseA.endTime || !courseB.endTime)
        return false
    let aDays = courseA.days
    let bDays = courseB.days
    if ((aDays.includes('M') && bDays.includes('M')) ||
        (aDays.includes('TU') && bDays.includes('TU')) ||
        (aDays.includes('W') && bDays.includes('W')) ||
        (aDays.includes('TH') && bDays.includes('TH')) ||
        (aDays.includes('F') && bDays.includes('F'))) {
        // Check time conflict
        let aStart = courseA.startTime
        let bStart = courseB.startTime
        let aEnd = courseA.endTime
        let bEnd = courseB.endTime
        if ((aStart >= bStart && aStart < bEnd) || (aEnd <= bEnd && aEnd > bStart) ||
            (bStart >= aStart && bStart < aEnd) || (bEnd <= aEnd && bEnd > aStart)) {
            invalidCourses.push(courseA.identifier)
            invalidCourses.push(courseB.identifier)
            return true
        }
    }
}
export type GeometryGuidance = {
  question: string;
  correct: string;
  options: string[];
  explanation: string;
};

export function geometryGuidanceForExercise(exerciseId: string): GeometryGuidance | null {
  if (exerciseId === "units-mm-cm-1") {
    const correct = "לחלק את מספר המילימטרים ב־10";
    return {
      question: "איך ממירים מילימטרים לסנטימטרים?",
      correct,
      options: [correct, "לכפול את המילימטרים ב־10", "לחלק את המילימטרים ב־100"],
      explanation: "בסנטימטר אחד יש 10 מילימטרים, לכן 35 ÷ 10 = 3.5 ס״מ.",
    };
  }
  if (exerciseId === "units-cm-m-1") {
    const correct = "לחלק את מספר הסנטימטרים ב־100";
    return {
      question: "איך ממירים סנטימטרים למטרים?",
      correct,
      options: [correct, "לכפול את הסנטימטרים ב־100", "לחלק את הסנטימטרים ב־10"],
      explanation: "במטר אחד יש 100 סנטימטרים, לכן 250 ÷ 100 = 2.5 מטרים.",
    };
  }
  if (exerciseId === "geometry-area-rectangle-1") {
    const correct = "לכפול את האורך ברוחב";
    return {
      question: "איך מחשבים שטח של מלבן?",
      correct,
      options: [correct, "לחבר את האורך והרוחב", "לכפול רק את האורך בעצמו"],
      explanation: "שטח מלבן הוא אורך כפול רוחב: 6 × 3 = 18 סמ״ר.",
    };
  }
  if (exerciseId === "geometry-area-square-1") {
    const correct = "לכפול את הצלע בעצמה";
    return {
      question: "איך מחשבים שטח של ריבוע?",
      correct,
      options: [correct, "לחבר את ארבע הצלעות", "לכפול צלע אחת ב־2"],
      explanation: "שטח ריבוע הוא צלע כפול צלע: 5 × 5 = 25 מ״ר.",
    };
  }
  if (exerciseId === "geometry-diameter-1") {
    const correct = "לחלק את הקוטר ב־2";
    return {
      question: "איך מוצאים רדיוס כשנתון הקוטר?",
      correct,
      options: [correct, "לכפול את הקוטר ב־2", "לחסר 2 מהקוטר"],
      explanation: "הרדיוס הוא חצי מהקוטר: 14 ÷ 2 = 7 ס״מ.",
    };
  }
  if (exerciseId === "geometry-radius-1") {
    const correct = "לכפול את הרדיוס ב־2";
    return {
      question: "איך מוצאים קוטר כשנתון הרדיוס?",
      correct,
      options: [correct, "לחלק את הרדיוס ב־2", "להוסיף 2 לרדיוס"],
      explanation: "הקוטר הוא פעמיים הרדיוס: 2 × 4 = 8 ס״מ.",
    };
  }
  if (exerciseId === "geometry-area-circle-1") {
    const correct = "להעלות את הרדיוס בריבוע ולכפול ב־3.14";
    return {
      question: "מהו הצעד הנכון לחישוב שטח העיגול הזה?",
      correct,
      options: [correct, "לכפול את הרדיוס ב־2", "לחבר את הרדיוס לקוטר"],
      explanation: "A = 3.14 × 2² = 3.14 × 4 = 12.56 סמ״ר.",
    };
  }
  return null;
}

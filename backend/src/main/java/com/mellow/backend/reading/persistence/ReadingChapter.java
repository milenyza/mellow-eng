package com.mellow.backend.reading.persistence;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reading_chapter")
public class ReadingChapter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false, updatable = false)
    private ReadingRun run;

    @Column(nullable = false, columnDefinition = "text")
    private String chapterRef;

    @Column(columnDefinition = "text")
    private String paragraphRef;

    private Instant readAt;
    private Long practiceIndex;
    private Boolean practiceFinished;

    protected ReadingChapter() {
    }

    public ReadingChapter(ReadingRun run, String chapterRef, String paragraphRef, Instant readAt,
                          Long practiceIndex, Boolean practiceFinished) {
        this.run = run;
        this.chapterRef = chapterRef;
        this.paragraphRef = paragraphRef;
        this.readAt = readAt;
        this.practiceIndex = practiceIndex;
        this.practiceFinished = practiceFinished;
    }

    public Boolean practiceFinished() {
        return practiceFinished;
    }

    public UUID id() {
        return id;
    }

    public String chapterRef() { return chapterRef; }
    public String paragraphRef() { return paragraphRef; }
    public Instant readAt() { return readAt; }
    public Long practiceIndex() { return practiceIndex; }

    public void update(String paragraph, Instant read, Long index, Boolean finished) {
        this.paragraphRef = paragraph;
        this.readAt = read;
        this.practiceIndex = index;
        this.practiceFinished = finished;
    }

}

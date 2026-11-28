package com.mellow.backend.reading.persistence;

import jakarta.persistence.*;
import com.mellow.backend.learner.persistence.Learner;

import java.util.LinkedHashSet;
import java.util.Set;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "story_progress")
public class StoryProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false, updatable = false)
    private Learner learner;

    @Column(nullable = false, columnDefinition = "text")
    private String storyRef;

    private long lifetimeActiveMs;

    @ElementCollection
    @CollectionTable(name = "story_read_chapter", joinColumns = @JoinColumn(name = "story_progress_id"))
    private Set<ReadChapter> readChapters = new LinkedHashSet<>();

    protected StoryProgress() {
    }

    public StoryProgress(Learner learner, String storyRef, long lifetimeActiveMs,
                         Set<ReadChapter> readChapters) {
        this.learner = learner;
        this.storyRef = storyRef;
        this.lifetimeActiveMs = lifetimeActiveMs;
        this.readChapters.addAll(readChapters);
    }

    public Set<ReadChapter> readChapters() {
        return Set.copyOf(readChapters);
    }

    @Embeddable
    public record ReadChapter(@Column(nullable = false, columnDefinition = "text") String chapterRef,
                              LocalDate readOn) {
    }

    public UUID id() { return id; }
    public String storyRef() { return storyRef; }
    public long lifetimeActiveMs() { return lifetimeActiveMs; }

    public void addActiveTime(long delta) {
        lifetimeActiveMs = Math.addExact(lifetimeActiveMs, delta);
    }

    public void markChapter(String reference) {
        if (readChapters.stream().noneMatch(mark -> mark.chapterRef().equals(reference))) {
            readChapters.add(new ReadChapter(reference, null));
        }
    }

}

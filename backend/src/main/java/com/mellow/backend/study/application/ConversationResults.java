package com.mellow.backend.study.application;

import com.mellow.backend.learner.persistence.Learner;
import com.mellow.backend.practical.persistence.SimulationSession;
import com.mellow.backend.practical.persistence.SimulationSession.Attempt;
import com.mellow.backend.practical.persistence.SimulationSession.Fit;
import com.mellow.backend.study.api.SessionDto;
import com.mellow.backend.study.persistence.CompletedSession.Timing;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.List;

import static com.mellow.backend.progress.application.ProgressCatalog.known;
import static com.mellow.backend.progress.application.ProgressSupport.invalid;

@Component
class ConversationResults {

    private final SessionCatalog catalog;
    private final JsonMapper json;

    ConversationResults(SessionCatalog catalog, JsonMapper json) {
        this.catalog = catalog;
        this.json = json;
    }

    SimulationSession create(Learner owner, String ref, Timing timing, SessionDto.SimulationWrite input) {
        var scenario = catalog.simulation(input.situationRef(), input.scenarioRef());
        var attempts = new ArrayList<Attempt>();
        var outcomes = new ArrayList<Outcome>();
        String next = scenario.start();
        int reviewed = 0;
        int firstAppropriate = 0;
        for (var decision : input.decisions()) {
            var node = known(scenario.nodes(), next);
            if (node.success() || !next.equals(decision.nodeRef()) || (decision.hintUsed() && !node.hint())) {
                throw invalid("The simulation decision or hint does not belong to this path.");
            }
            var selected = known(node.choices(), decision.choiceRef());
            if (selected.fit() != Fit.APPROPRIATE) {
                throw invalid("A decision can advance only through a context-appropriate choice.");
            }
            var responses = decision.attemptedChoiceRefs();
            for (int i = 0; i < responses.size(); i++) {
                String choice = responses.get(i);
                var fit = known(node.choices(), choice).fit();
                boolean mustBeAppropriate = !decision.reviewed() && i == responses.size() - 1;
                if (mustBeAppropriate ? fit != Fit.APPROPRIATE || !choice.equals(decision.choiceRef())
                        : fit == Fit.APPROPRIATE) {
                    throw invalid("Attempts do not support the recorded simulation decision or correction review.");
                }
                attempts.add(new Attempt(next, choice, fit));
            }
            GameResults.requireAttemptLimit(attempts.size());
            if (decision.reviewed()) reviewed++;
            if (!decision.reviewed() && responses.size() == 1) firstAppropriate++;
            outcomes.add(new Outcome(next, decision.choiceRef(), decision.reviewed(), decision.hintUsed()));
            next = selected.next();
        }
        if (!next.equals(input.terminalNodeRef()) || !known(scenario.nodes(), next).success()) {
            throw invalid("The conversation must reach its declared successful ending.");
        }
        var session = new SimulationSession(owner, ref, timing, input.situationRef(), input.scenarioRef(),
                input.decisions().size(), reviewed, attempts, input.timing().studyDays());
        session.addEvidence(json.writeValueAsString(new Evidence(next, firstAppropriate, outcomes)));
        return session;
    }

    private record Outcome(String nodeRef, String choiceRef, boolean reviewed, boolean hintUsed) {
    }

    private record Evidence(String terminalNodeRef, int firstAttemptAppropriate, List<Outcome> decisions) {
    }
}

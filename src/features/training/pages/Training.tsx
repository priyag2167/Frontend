import { useDebounced } from "@/shared/hooks/useDebounced";
import { UserSelect } from "@/shared/components/UserSelect";
import { lazy, Suspense, useState, type FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Box,
  GraduationCap,
  Plus,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { api, params, download } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import type {
  ContentItem,
  Assignment,
  Course,
  Page,
} from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Empty } from "@/shared/components/ui/Empty";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { Loading } from "@/shared/components/ui/Loading";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { ReasonDialog } from "@/shared/components/ui/ReasonDialog";
import { Status } from "@/shared/components/ui/Status";
import { Submit } from "@/shared/components/ui/Submit";
import { dateTime, localInput } from "@/shared/utils/format";

const SandboxScene = lazy(
  () => import("@/features/training/components/SandboxScene"),
);

export default function Training() {
  const [tab, setTab] = useState<"assignments" | "courses">("assignments"),
    [page, setPage] = useState(1),
    [creating, setCreating] = useState(false),
    [assigning, setAssigning] = useState(false),
    [quiz, setQuiz] = useState<Assignment | null>(null),
    [simulation, setSimulation] = useState<Assignment | null>(null),
    [review, setReview] = useState<Assignment | null>(null),
    [workflow, setWorkflow] = useState<{
      course: Course;
      action: string;
    } | null>(null);
  const manage = useCan("training.manage"),
    canReview = useCan("content.review"),
    isAdmin = useCan("admin.manage"),
    user = useSession().data!.user;
  const assignments = useQuery({
    queryKey: ["training", "assignments", page],
    queryFn: ({ signal }) =>
      api<Page<Assignment>>("/training/assignments" + params({ page }), {
        signal,
      }),
    enabled: tab === "assignments",
    placeholderData: keepPreviousData,
  });
  const courses = useQuery({
    queryKey: ["training", "courses", page],
    queryFn: ({ signal }) =>
      api<Page<Course>>("/training/courses" + params({ page }), { signal }),
    enabled: tab === "courses",
    placeholderData: keepPreviousData,
  });
  const [materialError, setMaterialError] = useState<unknown>(null);
  const start = useAction<{ id: string }>(
    (a) => `/training/assignments/${a.id}/start`,
    [["training"], ["audit"]],
    "POST",
    "",
  );
  const reviewAction = useAction(
    `/training/assignments/${review?.id}/review`,
    [["training"], ["lookups", "users"], ["audit"], ["dashboard"]],
    "POST",
    "Training review recorded.",
  );
  async function open(a: Assignment) {
    try {
      if (["assigned", "failed"].includes(a.status))
        await start.mutateAsync({ id: a.id });
      if (a.simulationProvider && a.status !== "assessment_pending")
        setSimulation(a);
      else setQuiz(a);
    } catch {
      /* shown below */
    }
  }
  const activeQuery = tab === "assignments" ? assignments : courses;
  function courseActions(c: Course) {
    const owner = c.ownerUserId === user.id || isAdmin;
    const reviewer = canReview && c.ownerUserId !== user.id;
    const out: string[] = [];
    if (manage && owner && ["draft", "rejected"].includes(c.status))
      out.push("submit");
    if (reviewer && c.status === "submitted") out.push("start_review");
    if (reviewer && c.status === "under_review") out.push("approve", "reject");
    if (manage && owner && c.status === "approved") out.push("publish");
    if (manage && owner && c.status === "published") out.push("retire");
    return out;
  }
  return (
    <>
      <PageHeader
        eyebrow="KNOWLEDGE IN PRACTICE"
        title="Learning & training"
        description="Build understanding. Demonstrate it. Keep the evidence together."
        actions={
          manage ? (
            <>
              <button
                className="btn secondary"
                onClick={() => setAssigning(true)}
              >
                <UserPlus size={16} />
                Assign course
              </button>
              <button className="btn primary" onClick={() => setCreating(true)}>
                <Plus size={16} />
                Create course
              </button>
            </>
          ) : null
        }
      />
      <div className="notice subtle">
        <ShieldCheck size={19} />
        <p>
          Passing an assessment requires independent review. Training completion
          alone does not establish regulated task qualification.
        </p>
      </div>
      <div className="panel">
        <div className="toolbar">
          <div className="filter-tabs">
            <button
              className={tab === "assignments" ? "active" : ""}
              onClick={() => {
                setTab("assignments");
                setPage(1);
              }}
            >
              Training assignments
            </button>
            <button
              className={tab === "courses" ? "active" : ""}
              onClick={() => {
                setTab("courses");
                setPage(1);
              }}
            >
              Course library
            </button>
          </div>
        </div>
        <ErrorMessage error={start.error || materialError} />
        <QueryState
          pending={activeQuery.isPending}
          error={activeQuery.error}
          retry={() => void activeQuery.refetch()}
        >
          {tab === "assignments" ? (
            assignments.data?.items.length ? (
              <div className="training-grid">
                {assignments.data.items.map((a) => (
                  <article className="training-card" key={a.id}>
                    <div className="section-heading">
                      <span
                        className={`metric-icon ${a.simulationProvider ? "violet" : "teal"}`}
                      >
                        {a.simulationProvider ? (
                          <Box size={22} />
                        ) : (
                          <GraduationCap size={22} />
                        )}
                      </span>
                      <Status value={a.status} />
                    </div>
                    <h3>{a.title}</h3>
                    <p className="muted">{a.learningObjectives}</p>
                    <div className="training-meta">
                      <span>{a.userName}</span>
                      <span>Due {dateTime(a.dueAt)}</span>
                      <span>
                        {a.attemptsUsed} / {a.maxAttempts} attempts · Pass{" "}
                        {a.passThreshold}%
                      </span>
                      {a.lastScore !== null && (
                        <strong>Last assessment: {a.lastScore}%</strong>
                      )}
                    </div>
                    {a.userId === user.id &&
                      a.contentVersionId &&
                      a.available && (
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => {
                            setMaterialError(null);
                            void download(
                              `/training/assignments/${a.id}/material`,
                              "learning-material.pdf",
                            ).catch(setMaterialError);
                          }}
                        >
                          <BookOpen size={16} /> Read learning material
                        </button>
                      )}
                    {!a.available && (
                      <div className="notice subtle">
                        This course or its learning material is no longer
                        published. Ask your training manager for a current
                        assignment.
                      </div>
                    )}
                    {a.userId === user.id &&
                      [
                        "assigned",
                        "in_progress",
                        "assessment_pending",
                        "failed",
                      ].includes(a.status) && (
                        <button
                          className="btn primary"
                          disabled={
                            start.isPending ||
                            !a.available ||
                            a.attemptsUsed >= a.maxAttempts
                          }
                          onClick={() => void open(a)}
                        >
                          {a.status === "assigned"
                            ? "Start learning"
                            : a.status === "assessment_pending"
                              ? "Take assessment"
                              : a.status === "failed"
                                ? "Retry training"
                                : "Continue learning"}
                        </button>
                      )}
                    {a.attemptsUsed >= a.maxAttempts &&
                      a.status === "failed" && (
                        <p className="muted">
                          All attempts used. Contact your training manager to
                          arrange retraining.
                        </p>
                      )}
                    {manage &&
                      a.available &&
                      a.userId !== user.id &&
                      a.status === "passed" && (
                        <button
                          className="btn secondary"
                          onClick={() => setReview(a)}
                        >
                          <ShieldCheck size={16} />
                          Review result
                        </button>
                      )}
                    {a.status === "passed" && (
                      <div className="notice subtle">
                        Assessment passed · awaiting independent review
                      </div>
                    )}
                    {a.status === "reviewed" && (
                      <div className="notice subtle">
                        Training record reviewed
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Make space for learning"
                description="Assigned courses and learning deadlines will appear here."
              />
            )
          ) : courses.data?.items.length ? (
            <div className="training-grid">
              {courses.data.items.map((c) => (
                <article className="training-card" key={c.id}>
                  <div className="section-heading">
                    <span className="eyebrow">
                      {c.code} · V{c.versionNumber}
                    </span>
                    <Status value={c.status} />
                  </div>
                  <h3>{c.title}</h3>
                  <p className="muted">{c.description}</p>
                  <div className="training-meta">
                    <span>{c.learningObjectives}</span>
                    <span>
                      Pass {c.passThreshold}% · {c.maxAttempts} attempts
                    </span>
                    {c.simulationProvider && (
                      <span className="development-label">
                        Simulation provider: {c.simulationProvider}
                      </span>
                    )}
                  </div>
                  <div className="content-actions">
                    {courseActions(c).map((action) => (
                      <button
                        className="btn small secondary"
                        key={action}
                        onClick={() => setWorkflow({ course: c, action })}
                      >
                        {action.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Knowledge, structured with purpose"
              description="Create a course with learning objectives and an assessment, then submit it for independent review."
            />
          )}
          <Pagination data={activeQuery.data} onPage={setPage} />
        </QueryState>
      </div>
      {creating && <CourseForm onClose={() => setCreating(false)} />}
      {assigning && <AssignForm onClose={() => setAssigning(false)} />}
      {quiz && <Quiz assignment={quiz} onClose={() => setQuiz(null)} />}
      {simulation && (
        <Simulation
          assignment={simulation}
          onClose={() => setSimulation(null)}
          onAssessment={() => {
            setQuiz(simulation);
            setSimulation(null);
          }}
        />
      )}
      {review && (
        <ReasonDialog
          title="Review passed training"
          description={`${review.userName} · ${review.title} · Score ${review.lastScore}%`}
          onClose={() => setReview(null)}
          pending={reviewAction.isPending}
          error={reviewAction.error}
          confirm={(comments) => reviewAction.mutateAsync({ comments })}
        />
      )}
      {workflow && (
        <CourseActionForm {...workflow} onClose={() => setWorkflow(null)} />
      )}
    </>
  );
}

type Question = { question: string; options: string[]; correctAnswer: number };
function CourseForm({ onClose }: { onClose: () => void }) {
  const canReadContent = useCan("content.read");
  const [code, setCode] = useState(""),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [objectives, setObjectives] = useState(""),
    [threshold, setThreshold] = useState(80),
    [attempts, setAttempts] = useState(3),
    [days, setDays] = useState(365),
    [sandbox, setSandbox] = useState(false),
    [questions, setQuestions] = useState<Question[]>([
      { question: "", options: ["", ""], correctAnswer: 0 },
    ]);
  const [contentVersionId, setMaterial] = useState("");
  const content = useQuery({
    queryKey: ["content", "training-materials"],
    enabled: canReadContent,
    queryFn: ({ signal }) =>
      api<Page<ContentItem>>("/content?usableOnly=true&pageSize=100", {
        signal,
      }),
  });
  const save = useAction(
    "/training/courses",
    [["training"], ["audit"]],
    "POST",
    "Course created as a draft.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        code,
        title,
        description,
        learningObjectives: objectives,
        passThreshold: threshold,
        maxAttempts: attempts,
        retrainingDays: days,
        contentVersionId: contentVersionId || null,
        simulationProvider: sandbox ? "sandbox" : null,
        simulationAssetRef: sandbox ? "equipment-orientation:v1" : null,
        assessment: questions,
      });
      onClose();
    } catch {
      /* shown below */
    }
  }
  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q, j) => (j === i ? { ...q, ...patch } : q)),
    );
  }
  return (
    <Dialog
      title="Create a learning course"
      description="Define the learning objective and how understanding will be assessed."
      onClose={onClose}
      wide
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Unique course code">
            <input
              required
              maxLength={100}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. SOP-101"
            />
          </Field>
          <Field label="Course title">
            <input
              required
              maxLength={240}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            required
            rows={2}
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Learning objectives">
          <textarea
            required
            rows={2}
            maxLength={4000}
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
          />
        </Field>
        <div className="form-grid three">
          <Field label="Pass threshold (%)">
            <input
              type="number"
              required
              min={1}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </Field>
          <Field label="Maximum attempts">
            <input
              type="number"
              required
              min={1}
              max={10}
              value={attempts}
              onChange={(e) => setAttempts(Number(e.target.value))}
            />
          </Field>
          <Field label="Retraining interval (days)">
            <input
              type="number"
              required
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </Field>
        </div>
        {import.meta.env.DEV && (
          <label className="check-field">
            <input
              type="checkbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
            />
            Include the development equipment-orientation sandbox (v1)
          </label>
        )}
        {canReadContent && (
          <Field
            label="Published training document / SOP (optional)"
            hint="Only current, effective and unexpired published material is available."
          >
            <select
              value={contentVersionId}
              onChange={(e) => setMaterial(e.target.value)}
            >
              <option value="">No linked document</option>
              {content.data?.items.map((item) => (
                <option key={item.id} value={item.currentVersionId}>
                  {item.title} · v{item.versionNumber}
                </option>
              ))}
            </select>
          </Field>
        )}
        <ErrorMessage error={content.error} />
        <h3>Assessment questions</h3>
        {questions.map((q, i) => (
          <fieldset key={i}>
            <legend>Question {i + 1}</legend>
            <Field label="Question">
              <input
                required
                maxLength={1000}
                value={q.question}
                onChange={(e) =>
                  updateQuestion(i, { question: e.target.value })
                }
              />
            </Field>
            {q.options.map((option, j) => (
              <Field key={j} label={`Option ${j + 1}`}>
                <input
                  required
                  maxLength={1000}
                  value={option}
                  onChange={(e) =>
                    updateQuestion(i, {
                      options: q.options.map((o, k) =>
                        j === k ? e.target.value : o,
                      ),
                    })
                  }
                />
              </Field>
            ))}
            <Field label="Correct answer">
              <select
                value={q.correctAnswer}
                onChange={(e) =>
                  updateQuestion(i, { correctAnswer: Number(e.target.value) })
                }
              >
                {q.options.map((_, j) => (
                  <option key={j} value={j}>
                    Option {j + 1}
                  </option>
                ))}
              </select>
            </Field>
            <div className="row-actions">
              {q.options.length < 6 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    updateQuestion(i, { options: [...q.options, ""] })
                  }
                >
                  Add option
                </button>
              )}
              {questions.length > 1 && (
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() =>
                    setQuestions((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  Remove question
                </button>
              )}
            </div>
          </fieldset>
        ))}
        {questions.length < 50 && (
          <button
            className="btn secondary"
            type="button"
            onClick={() =>
              setQuestions((prev) => [
                ...prev,
                { question: "", options: ["", ""], correctAnswer: 0 },
              ])
            }
          >
            <Plus size={15} />
            Add question
          </button>
        )}
        <ErrorMessage error={save.error} />
        <div className="form-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancel
          </button>
          <Submit pending={save.isPending}>Create course draft</Submit>
        </div>
      </form>
    </Dialog>
  );
}
function AssignForm({ onClose }: { onClose: () => void }) {
  const [courseVersionId, setCourse] = useState(""),
    [userId, setUser] = useState(""),
    [due, setDue] = useState(() =>
      localInput(new Date(Date.now() + 7 * 86400000)),
    );
  const [search, setSearch] = useState("");
  const term = useDebounced(search);
  const courses = useQuery({
    queryKey: ["training", "assignable", term],
    queryFn: ({ signal }) =>
      api<Page<Course>>(
        "/training/courses" +
          params({ pageSize: 100, assignableOnly: true, search: term }),
        { signal },
      ),
  });
  const save = useAction(
    "/training/assignments",
    [
      ["training"],
      ["lookups", "users"],
      ["notifications"],
      ["audit"],
      ["dashboard"],
    ],
    "POST",
    "Course assigned.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        courseVersionId,
        userId,
        dueAt: new Date(due).toISOString(),
      });
      onClose();
    } catch {
      /* shown below */
    }
  }
  return (
    <Dialog
      title="Assign a course"
      description="Only published course versions can be assigned."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <Field
          label="Find a published course"
          hint="Only published courses with current learning material can be assigned."
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or course code"
          />
        </Field>
        <Field label="Published course">
          <select
            required
            value={courseVersionId}
            onChange={(e) => {
              setCourse(e.target.value);
              setUser("");
            }}
          >
            <option value="">Choose a course</option>
            {courses.data?.items
              .filter((c) => c.status === "published")
              .map((c) => (
                <option key={c.id} value={c.courseVersionId}>
                  {c.title} · v{c.versionNumber}
                </option>
              ))}
          </select>
        </Field>
        {courses.data?.total === 0 && (
          <p role="status">
            No assignable courses match. Publish a reviewed course or choose a
            different search.
          </p>
        )}
        {courses.data && courses.data.total > 100 && (
          <p>Showing 100 matches. Narrow the search to find another course.</p>
        )}
        <UserSelect
          label="Learner"
          purpose="training-learner"
          value={userId}
          onChange={setUser}
          courseVersionId={courseVersionId}
          waitForContext={!courseVersionId}
        />
        <Field label="Due date">
          <input
            type="datetime-local"
            required
            min={localInput()}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </Field>
        <ErrorMessage error={save.error || courses.error} />
        <Submit pending={save.isPending}>Assign course</Submit>
      </form>
    </Dialog>
  );
}
function CourseActionForm({
  course,
  action,
  onClose,
}: {
  course: Course;
  action: string;
  onClose: () => void;
}) {
  const save = useAction(
    `/training/courses/${course.id}/actions`,
    [["training"], ["audit"]],
    "POST",
    "Course workflow updated.",
  );
  return (
    <ReasonDialog
      title={`${action.replaceAll("_", " ")} course`}
      description={course.title}
      onClose={onClose}
      pending={save.isPending}
      error={save.error}
      confirm={(comments) => save.mutateAsync({ action, comments })}
    />
  );
}
function Quiz({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const query = useQuery({
    queryKey: ["training", "assessment", assignment.id],
    queryFn: ({ signal }) =>
      api<{
        questions: { index: number; question: string; options: string[] }[];
        passThreshold: number;
        maxAttempts: number;
      }>(`/training/assignments/${assignment.id}/assessment`, { signal }),
  });
  const save = useAction<
    { answers: number[] },
    {
      score: number;
      passed: boolean;
      requiresManagerReview: boolean;
      attemptsRemaining: number;
    }
  >(
    `/training/assignments/${assignment.id}/assessment`,
    [["training"], ["lookups", "users"], ["audit"], ["dashboard"]],
    "POST",
    "Assessment recorded.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        answers: query.data!.questions.map((q) => answers[q.index] ?? -1),
      });
    } catch {
      /* shown below */
    }
  }
  return (
    <Dialog
      title="Knowledge assessment"
      description={assignment.title}
      onClose={onClose}
      wide
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {save.data ? (
          <div className="assessment-result">
            <GraduationCap size={42} />
            <h2>{save.data.score}%</h2>
            <Status value={save.data.passed ? "passed" : "failed"} />
            <p>
              {save.data.passed
                ? "Your assessment passed. Your training record is awaiting independent manager review."
                : `The pass threshold was not met. ${save.data.attemptsRemaining} attempts remain.`}
            </p>
            <button className="btn primary" onClick={onClose}>
              Return to learning
            </button>
          </div>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            <div className="notice">
              <BookOpen size={19} />
              <p>{assignment.learningObjectives}</p>
            </div>
            <p className="muted">
              Pass threshold: {query.data?.passThreshold}%. Answers are scored
              on the server.
            </p>
            {query.data?.questions.map((q) => (
              <fieldset key={q.index}>
                <legend>
                  {q.index + 1}. {q.question}
                </legend>
                {q.options.map((option, j) => (
                  <label className="quiz-option" key={j}>
                    <input
                      type="radio"
                      name={`q-${q.index}`}
                      required
                      checked={answers[q.index] === j}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.index]: j }))
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
            ))}
            <ErrorMessage error={save.error} />
            <Submit pending={save.isPending}>Submit assessment</Submit>
          </form>
        )}
      </QueryState>
    </Dialog>
  );
}
function Simulation({
  assignment,
  onClose,
  onAssessment,
}: {
  assignment: Assignment;
  onClose: () => void;
  onAssessment: () => void;
}) {
  const [visited, setVisited] = useState<string[]>([]);
  const [session, setSession] = useState<{ id: string } | null>(null);
  const launch = useAction<{ trainingAssignmentId: string }, { id: string }>(
    "/vr/sessions",
    [["training"]],
    "POST",
    "",
  );
  const finish = useAction(
    `/vr/sessions/${session?.id}/sandbox-events`,
    [["training"], ["audit"]],
    "POST",
    "Sandbox session completed.",
  );
  async function start() {
    try {
      const result = await launch.mutateAsync({
        trainingAssignmentId: assignment.id,
      });
      setSession(result);
    } catch {
      /* shown below */
    }
  }
  async function complete() {
    try {
      await finish.mutateAsync({ status: "completed" });
      onAssessment();
    } catch {
      /* shown below */
    }
  }
  return (
    <Dialog
      title="Equipment orientation sandbox"
      description="Development simulation · no connection to production machinery."
      onClose={onClose}
      wide
    >
      <div className="form-stack">
        <div className="notice">
          <Box size={18} />
          <p>
            This local 3D exercise tests the training workflow. It is not an
            approved operating procedure or a qualification record.
          </p>
        </div>
        {!session ? (
          <>
            <p>{assignment.learningObjectives}</p>
            <button
              className="btn primary"
              disabled={launch.isPending}
              onClick={() => void start()}
            >
              Start sandbox session
            </button>
          </>
        ) : (
          <>
            <Suspense fallback={<Loading />}>
              <SandboxScene
                onSelect={(part) =>
                  setVisited((prev) =>
                    prev.includes(part) ? prev : [...prev, part],
                  )
                }
              />
            </Suspense>
            <p className="muted">
              Select the three labelled components to explore the training
              model. Drag to rotate.
            </p>
            <div className="sandbox-checklist">
              {["Hopper", "Press", "Outlet"].map((part) => (
                <Status
                  key={part}
                  value={visited.includes(part) ? "explored" : "pending"}
                />
              ))}
            </div>
            <p>{visited.length} of 3 components explored.</p>
            <button
              className="btn primary"
              disabled={visited.length < 3 || finish.isPending}
              onClick={() => void complete()}
            >
              Finish simulated exercise & continue to assessment
            </button>
          </>
        )}
        <ErrorMessage error={launch.error || finish.error} />
      </div>
    </Dialog>
  );
}
